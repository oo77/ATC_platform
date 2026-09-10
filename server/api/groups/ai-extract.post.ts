/**
 * API Endpoint: POST /api/groups/ai-extract
 * Распознавание слушателей из текста, PDF-приказов или изображений с сопоставлением с базой ATC
 */

import { defineEventHandler, readMultipartFormData, readBody, createError } from "h3";
import OpenAI from "openai";
import { aiSettingsRepository } from "../../repositories/aiSettingsRepository";
import { getStudentsForMatching } from "../../repositories/studentRepository";
import { checkStudentConflicts, getGroupById } from "../../repositories/groupRepository";
import { pdfConverter } from "../../utils/ai/pdfConverter";
import { requirePermission } from "../../utils/permissions";
import { Permission } from "../../types/permissions";
import { executeQuery } from "../../utils/db";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";

const EXTRACTION_SYSTEM_PROMPT = `Ты — дружелюбный ассистент оператора авиационного учебного центра. Тебе присылают текст, служебную записку, приказ на обучение, список слушателей или скан документа — нужно найти в них людей для зачисления в учебную группу.

Твоя задача:
1. Извлеки ФИО каждого упомянутого слушателя/сотрудника, а также должность, подразделение, организацию и ПИНФЛ (если указан).
   Не придумывай данные, которых нет в источнике — если данных нет, оставь пустую строку.
   ВАЖНО: записывай ФИО именно в том алфавите и написании, как они даны в источнике (кириллица остаётся кириллицей, латиница — латиницей).
2. Напиши короткий (1-3 предложения) живой ответ оператору на русском в поле "reply":
   - Если нашёл людей — кратко скажи, сколько человек распознано и из какого документа/подразделения (если понятно).
   - Если ничего похожего на список людей не нашёл — вежливо объясни, что увидел, и подскажи, что прислать (текстовый список ФИО, скан приказа или PDF служебной записки).

Ответь СТРОГО в виде JSON без пояснений и без markdown-ограждений, в формате:
{
  "reply": "...",
  "people": [
    {
      "name": "Фамилия Имя Отчество",
      "pinfl": "",
      "position": "",
      "department": "",
      "organization": ""
    }
  ]
}
Если людей в источнике нет — верни "people":[], но обязательно заполни "reply".`;

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "x", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "",
  э: "e", ю: "yu", я: "ya", ў: "o", қ: "q", ғ: "g", ҳ: "h",
};

function normalizeNameForMatch(raw: string): string {
  let out = "";
  for (const ch of (raw || "").toLowerCase()) {
    out += CYRILLIC_TO_LATIN[ch] ?? ch;
  }
  out = out.replace(/[ʻʼ'`’‘]/g, "");
  out = out.replace(/[^a-z0-9\s]/g, " ");
  return out.replace(/\s+/g, " ").trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[n];
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (!maxLen) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

function normalizeStem(str: string): string {
  let s = normalizeNameForMatch(str);
  s = s.replace(/kh/g, "x").replace(/h/g, "x");
  s = s.replace(/dj/g, "j").replace(/zh/g, "j");
  s = s.replace(/iy$/g, "i").replace(/yy$/g, "y");
  s = s.replace(/(ov|ova|ev|eva|vich|vna|ovna|evna)$/g, "");
  return s.trim();
}

function normalizeInitial(ch: string): string {
  const c = normalizeNameForMatch(ch).trim();
  if (c === "h" || c === "kh") return "x";
  if (c === "j" || c === "zh" || c === "dj") return "j";
  return c[0] || "";
}

interface ParsedNameQuery {
  surname: string;
  initials: string[];
  fullTokens: string[];
}

function parsePersonQuery(rawName: string): ParsedNameQuery {
  const norm = normalizeNameForMatch(rawName);
  const tokens = norm.split(" ").filter(Boolean);
  if (!tokens.length) return { surname: "", initials: [], fullTokens: [] };

  const shortTokens = tokens.filter((t) => t.length <= 2);
  const longTokens = tokens.filter((t) => t.length > 2);

  // Формат с 1 длинным словом и 1-2 инициалами: "X.Xasanov", "Xasanov X.", "X. G. Xasanov"
  if (longTokens.length === 1) {
    return {
      surname: longTokens[0],
      initials: shortTokens.map((t) => normalizeInitial(t)),
      fullTokens: tokens,
    };
  }

  // Формат с несколькими словами: "Хасанов Хабибилло"
  return {
    surname: tokens[0],
    initials: tokens.slice(1).map((t) => normalizeInitial(t)),
    fullTokens: tokens,
  };
}

function calculateTextOverlap(query: string, target: string): number {
  if (!query || !target) return 0;
  const qNorm = normalizeStem(query);
  const tNorm = normalizeStem(target);
  const qWords = qNorm.split(" ").filter((w) => w.length >= 3);
  if (!qWords.length) return 0;

  let matched = 0;
  for (const qw of qWords) {
    const stem = qw.slice(0, 4);
    if (tNorm.includes(stem)) {
      matched++;
    }
  }
  return matched / qWords.length;
}

interface NormalizedStudent {
  id: string;
  fullName: string;
  pinfl: string;
  organization: string;
  position: string;
  department: string;
  normalizedName: string;
  normalizedTokens: string[];
}

interface PersonPrimaryData {
  name: string;
  pinfl?: string;
  position?: string;
  department?: string;
  organization?: string;
}

function scoreCandidate(
  person: PersonPrimaryData,
  cand: NormalizedStudent
): number {
  // 1. Точное совпадение по ПИНФЛ (14 цифр)
  const cleanPinfl = (person.pinfl || "").trim();
  if (/^\d{14}$/.test(cleanPinfl) && cand.pinfl === cleanPinfl) {
    return 1.0;
  }

  const parsed = parsePersonQuery(person.name);
  if (!parsed.surname) return 0;

  const candTokens = cand.normalizedTokens;
  if (!candTokens.length) return 0;

  const qSurname = parsed.surname;
  const qSurnameStem = normalizeStem(qSurname);

  const candSurname = candTokens[0];
  const candSurnameStem = normalizeStem(candSurname);

  // Сравнение фамилии (прямое и по стеммингу x/h/kh)
  const exactSim = similarity(qSurname, candSurname);
  const stemSim = similarity(qSurnameStem, candSurnameStem);
  let surnameSim = Math.max(exactSim, stemSim);

  let isCandSurnameMatch = true;

  // Если на первом месте не совпало, проверим другие токены (если имя записано Имя Фамилия)
  if (surnameSim < 0.6) {
    for (let i = 1; i < candTokens.length; i++) {
      const altExact = similarity(qSurname, candTokens[i]);
      const altStem = similarity(qSurnameStem, normalizeStem(candTokens[i]));
      const altSim = Math.max(altExact, altStem);
      if (altSim > surnameSim) {
        surnameSim = altSim;
        isCandSurnameMatch = false;
      }
    }
  }

  // Порог отсечения: если схожесть фамилии меньше 48%, отсекаем
  if (surnameSim < 0.48) return 0;

  // Если слово совпало с именем/отчеством, а не фамилией — снижаем вес
  if (!isCandSurnameMatch) {
    surnameSim *= 0.55;
  }

  // 2. Сравнение инициалов (первая буква имени и отчества)
  let initialsScore = 0;
  let hasInitials = false;
  if (parsed.initials.length > 0) {
    hasInitials = true;
    const qFirstInit = parsed.initials[0];
    const candFirstInit = normalizeInitial(candTokens[1] || "");
    if (qFirstInit && candFirstInit) {
      if (qFirstInit === candFirstInit) {
        initialsScore += 0.8;
      } else {
        // Явное несовпадение первой буквы имени
        initialsScore -= 0.3;
      }
    }

    if (parsed.initials.length > 1) {
      const qSecondInit = parsed.initials[1];
      const candSecondInit = normalizeInitial(candTokens[2] || "");
      if (qSecondInit && candSecondInit) {
        if (qSecondInit === candSecondInit) initialsScore += 0.2;
        else initialsScore -= 0.1;
      }
    }
  }

  // 3. Должность (из первичных данных документа)
  let posBoost = 0;
  if (person.position) {
    const pSim = calculateTextOverlap(person.position, `${cand.position} ${cand.department}`);
    if (pSim > 0.5) posBoost = 0.30;
    else if (pSim > 0) posBoost = 0.15;
  }

  // 4. Подразделение
  let deptBoost = 0;
  if (person.department) {
    const dSim = calculateTextOverlap(person.department, `${cand.department} ${cand.position}`);
    if (dSim > 0.5) deptBoost = 0.15;
    else if (dSim > 0) deptBoost = 0.08;
  }

  // 5. Организация
  let orgBoost = 0;
  if (person.organization && cand.organization) {
    const oSim = calculateTextOverlap(person.organization, cand.organization);
    if (oSim > 0.5) orgBoost = 0.15;
    else if (oSim > 0) orgBoost = 0.08;
  }

  // Итоговый скор
  let totalScore = 0;
  if (hasInitials) {
    totalScore = (surnameSim * 0.45) + (Math.max(0, initialsScore) * 0.25) + posBoost + deptBoost + orgBoost;
  } else {
    totalScore = (surnameSim * 0.60) + posBoost + deptBoost + orgBoost;
  }

  // Бонус за безупречное совпадение (фамилия + инициал + должность)
  if (surnameSim >= 0.85 && initialsScore >= 0.8 && posBoost >= 0.2) {
    totalScore = Math.max(totalScore, 0.95);
  }

  return Math.min(1.0, Math.max(0, totalScore));
}

function findStudentCandidates(
  person: PersonPrimaryData,
  students: NormalizedStudent[],
): Array<{ student: NormalizedStudent; confidence: number }> {
  const scored = students
    .map((s) => ({ student: s, confidence: scoreCandidate(person, s) }))
    .filter((item) => item.confidence >= 0.35)
    .sort((a, b) => b.confidence - a.confidence);

  return scored.slice(0, 5);
}

export default defineEventHandler(async (event) => {
  // 1. Проверка прав
  try {
    await requirePermission(event, Permission.GROUPS_MANAGE_STUDENTS);
  } catch {
    const user = event.context.user;
    if (!user || !["ADMIN", "MANAGER"].includes(user.role)) {
      throw createError({ statusCode: 403, message: "Недостаточно прав для управления группами" });
    }
  }

  // 2. Получение настроек AI
  const dbSettings = await aiSettingsRepository.getDefault().catch(() => null);
  let apiKey = "";
  let provider = "openai";
  let baseUrl: string | null = null;
  let textModel = "gpt-4o-mini";
  let visionModel = "gpt-4o";

  if (dbSettings) {
    const decryptedKey = await aiSettingsRepository.getDecryptedApiKey(dbSettings.id).catch(() => null);
    if (decryptedKey) {
      apiKey = decryptedKey;
      provider = dbSettings.provider;
      baseUrl = dbSettings.baseUrl;
      textModel = dbSettings.textModel || "gpt-4o-mini";
      visionModel = dbSettings.visionModel || "gpt-4o";
    }
  }

  if (!apiKey) {
    apiKey = process.env.OPENAI_API_KEY || "";
    provider = process.env.USE_OPENROUTER === "true" ? "openrouter" : "openai";
    baseUrl = process.env.USE_OPENROUTER === "true" ? "https://openrouter.ai/api/v1" : null;
    textModel = process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";
    visionModel = process.env.OPENAI_VISION_MODEL || "gpt-4o";
  }

  if (!apiKey) {
    throw createError({
      statusCode: 400,
      message: "AI провайдер не настроен. Укажите API ключ в настройках системы.",
    });
  }

  const { resolveBaseUrl } = await import("../../utils/ai/aiProvidersConfig");
  const resolvedBaseUrl = resolveBaseUrl(provider, baseUrl);

  const openai = new OpenAI({
    apiKey,
    baseURL: resolvedBaseUrl,
    defaultHeaders: provider === "openrouter"
      ? { "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000", "X-Title": "ATC Platform Group AI" }
      : undefined,
  });

  // 3. Чтение параметров запроса (поддержка multipart и json)
  let text = "";
  let groupId: string | undefined;
  let startDate: string | undefined;
  let endDate: string | undefined;
  let organizationId: string | undefined;
  let fileBuffer: Buffer | null = null;
  let fileMime: string | null = null;
  let fileName: string | null = null;

  const contentType = getHeader(event, "content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await readMultipartFormData(event);
    if (formData) {
      for (const part of formData) {
        if (part.name === "text") text = part.data.toString("utf-8");
        else if (part.name === "groupId") groupId = part.data.toString("utf-8");
        else if (part.name === "startDate") startDate = part.data.toString("utf-8");
        else if (part.name === "endDate") endDate = part.data.toString("utf-8");
        else if (part.name === "organizationId") organizationId = part.data.toString("utf-8");
        else if (part.name === "file" && part.data) {
          fileBuffer = part.data;
          fileMime = part.type || null;
          fileName = part.filename || null;
        }
      }
    }
  } else {
    const body = await readBody(event).catch(() => ({}));
    text = body.text || "";
    groupId = body.groupId;
    startDate = body.startDate;
    endDate = body.endDate;
    organizationId = body.organizationId;
  }

  // Если groupId передан, подтягиваем даты группы (если не переданы явно)
  let groupExistingStudentIds: string[] = [];
  if (groupId) {
    const group = await getGroupById(groupId).catch(() => null);
    if (group) {
      if (!startDate && group.startDate) startDate = new Date(group.startDate).toISOString().split("T")[0];
      if (!endDate && group.endDate) endDate = new Date(group.endDate).toISOString().split("T")[0];
      const enrolled = await executeQuery<Array<{ student_id: string }>>(
        "SELECT student_id FROM study_group_students WHERE group_id = ?",
        [groupId]
      );
      groupExistingStudentIds = Array.isArray(enrolled)
        ? enrolled.map((r) => r.student_id)
        : [];
    }
  }

  // 4. Подготовка контента для AI
  let extractedDocText = "";
  let imageBase64: string | null = null;

  if (fileBuffer) {
    if (fileMime === "application/pdf" || fileName?.toLowerCase().endsWith(".pdf")) {
      const tempPath = path.join(os.tmpdir(), `ai_extract_${uuidv4()}.pdf`);
      await fs.writeFile(tempPath, fileBuffer);
      try {
        extractedDocText = await pdfConverter.extractText(tempPath);
      } finally {
        await fs.unlink(tempPath).catch(() => {});
      }
    } else if (fileMime?.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(fileName || "")) {
      imageBase64 = fileBuffer.toString("base64");
    }
  }

  const promptTextParts: string[] = [];
  if (text.trim()) promptTextParts.push(`Текст запроса/сообщения:\n${text.trim()}`);
  if (extractedDocText.trim()) promptTextParts.push(`Текст из загруженного документа:\n${extractedDocText.trim()}`);

  if (!promptTextParts.length && !imageBase64) {
    return {
      success: true,
      reply: "Пришлите текстовый список ФИО, PDF-документ приказа или фото списка слушателей.",
      items: [],
    };
  }

  // 5. Вызов модели AI
  let rawAiReply = "";
  try {
    if (imageBase64) {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: promptTextParts.join("\n\n") || "Извлеки список слушателей из изображения приказа." },
            {
              type: "image_url",
              image_url: {
                url: `data:${fileMime || "image/jpeg"};base64,${imageBase64}`,
                detail: "high",
              },
            },
          ],
        },
      ];
      const completion = await openai.chat.completions.create({
        model: visionModel,
        messages,
        temperature: 0.1,
        max_tokens: 2000,
      });
      rawAiReply = completion.choices[0]?.message?.content || "";
    } else {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
        { role: "user", content: promptTextParts.join("\n\n") },
      ];
      const completion = await openai.chat.completions.create({
        model: textModel,
        messages,
        temperature: 0.1,
        max_tokens: 2000,
      });
      rawAiReply = completion.choices[0]?.message?.content || "";
    }
  } catch (aiErr: any) {
    console.error("[ai-extract] AI call error:", aiErr);
    throw createError({
      statusCode: 500,
      message: `Ошибка обращения к ИИ (${aiErr.message || "сбой соединения"})`,
    });
  }

  // 6. Разбор ответа ИИ
  let cleanJson = rawAiReply.trim();
  cleanJson = cleanJson.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const firstBrace = cleanJson.indexOf("{");
  const lastBrace = cleanJson.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) cleanJson = cleanJson.slice(firstBrace, lastBrace + 1);

  let parsedData: { reply?: string; people?: any[] } = {};
  try {
    parsedData = JSON.parse(cleanJson);
  } catch (jsonErr) {
    console.warn("[ai-extract] Failed to parse JSON from AI response:", rawAiReply);
    return {
      success: true,
      reply: "Не удалось структурировать список слушателей из присланного материала. Попробуйте прислать список текстом.",
      items: [],
    };
  }

  const people: Array<{
    name: string;
    pinfl?: string;
    position?: string;
    department?: string;
    organization?: string;
  }> = Array.isArray(parsedData.people)
    ? parsedData.people.filter((p: any) => p && typeof p.name === "string" && p.name.trim().length > 1)
    : [];

  const aiReply = parsedData.reply || (people.length ? `Найдено ${people.length} слушателей.` : "Слушатели в документе не обнаружены.");

  if (!people.length) {
    return {
      success: true,
      reply: aiReply,
      items: [],
    };
  }

  // 7. Сопоставление с базой слушателей ATC
  const allStudents = await getStudentsForMatching(organizationId || null);
  const normalizedStudents: NormalizedStudent[] = allStudents.map((s) => {
    const norm = normalizeNameForMatch(s.fullName);
    return {
      id: s.id,
      fullName: s.fullName,
      pinfl: s.pinfl || "",
      organization: s.organization || "",
      position: s.position || "",
      department: s.department || "",
      normalizedName: norm,
      normalizedTokens: norm.split(" ").filter(Boolean),
    };
  });

  let candidateIdsForConflicts: string[] = [];

  const reviewItems = people.map((p) => {
    const scored = findStudentCandidates(p, normalizedStudents);
    const top = scored[0];
    const second = scored[1];

    let status: "matched" | "ambiguous" | "not_found" = "not_found";
    if (top && top.confidence >= 0.8) {
      if (!second || (top.confidence - second.confidence >= 0.15)) {
        status = "matched";
      } else {
        status = "ambiguous";
      }
    } else if (top && top.confidence >= 0.35) {
      status = "ambiguous";
    }

    const candidateList = scored.map(({ student, confidence }) => {
      candidateIdsForConflicts.push(student.id);
      return {
        id: student.id,
        fullName: student.fullName,
        pinfl: student.pinfl,
        organization: student.organization,
        position: student.position,
        department: student.department,
        confidence: Math.round(confidence * 100),
        alreadyInGroup: groupExistingStudentIds.includes(student.id),
      };
    });

    const chosenId = (status === "matched" || status === "ambiguous") && candidateList[0] 
      ? candidateList[0].id 
      : null;

    return {
      rawName: p.name,
      pinfl: p.pinfl || "",
      position: p.position || "",
      department: p.department || "",
      organization: p.organization || "",
      status,
      candidates: candidateList,
      chosenId,
      skip: Boolean(chosenId && groupExistingStudentIds.includes(chosenId)),
      conflict: null as any,
    };
  });

  // 8. Проверка конфликтов расписания
  if (startDate && endDate && candidateIdsForConflicts.length > 0) {
    try {
      const uniqueIds = Array.from(new Set(candidateIdsForConflicts));
      const conflicts = await checkStudentConflicts(uniqueIds, startDate, endDate, groupId, groupId);
      if (conflicts.length > 0) {
        const conflictMap = new Map<string, any>();
        for (const c of conflicts) {
          conflictMap.set(c.studentId, c);
        }
        for (const item of reviewItems) {
          if (item.chosenId && conflictMap.has(item.chosenId)) {
            item.conflict = conflictMap.get(item.chosenId);
          }
        }
      }
    } catch (confErr) {
      console.warn("[ai-extract] Conflict check error (ignored):", confErr);
    }
  }

  return {
    success: true,
    reply: aiReply,
    items: reviewItems,
  };
});
