/**
 * AI Providers Configuration & Model Discovery Registry
 * Содержит топовых 10 провайдеров + Custom, их базовые адреса, пресеты моделей и классификатор Vision/Text
 */

import OpenAI from "openai";

export interface AIProviderDefinition {
  id: string;
  name: string;
  defaultBaseUrl: string;
  description: string;
  testModel: string;
  defaultVisionModel: string;
  defaultTextModel: string;
  presetVisionModels: string[];
  presetTextModels: string[];
  requiresBaseUrl?: boolean;
}

export const TOP_AI_PROVIDERS: AIProviderDefinition[] = [
  {
    id: "openai",
    name: "OpenAI",
    defaultBaseUrl: "https://api.openai.com/v1",
    description: "GPT-4o, GPT-4o-mini, o1, o3-mini",
    testModel: "gpt-4o-mini",
    defaultVisionModel: "gpt-4o",
    defaultTextModel: "gpt-4o-mini",
    presetVisionModels: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1"],
    presetTextModels: ["gpt-4o-mini", "gpt-4o", "o3-mini", "o1", "gpt-4-turbo", "gpt-3.5-turbo"],
  },
  {
    id: "openrouter",
    name: "OpenRouter (All-in-One)",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    description: "Доступ ко всем мировым моделям через один ключ",
    testModel: "openai/gpt-4o-mini",
    defaultVisionModel: "openai/gpt-4o",
    defaultTextModel: "openai/gpt-4o-mini",
    presetVisionModels: [
      "openai/gpt-4o",
      "openai/gpt-4o-mini",
      "google/gemini-1.5-flash",
      "google/gemini-1.5-pro",
      "anthropic/claude-3.5-sonnet",
      "meta-llama/llama-3.2-11b-vision-instruct",
      "qwen/qwen-2.5-vl-72b-instruct",
    ],
    presetTextModels: [
      "openai/gpt-4o-mini",
      "deepseek/deepseek-chat",
      "anthropic/claude-3.5-haiku",
      "meta-llama/llama-3.3-70b-instruct",
      "google/gemini-2.0-flash-exp:free",
      "qwen/qwen-2.5-72b-instruct",
    ],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    description: "Gemini 2.0 Flash, Gemini 1.5 Pro (OpenAI API)",
    testModel: "gemini-1.5-flash",
    defaultVisionModel: "gemini-1.5-flash",
    defaultTextModel: "gemini-1.5-flash",
    presetVisionModels: [
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-2.0-flash",
      "gemini-2.0-flash-exp",
    ],
    presetTextModels: [
      "gemini-1.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-pro",
      "gemini-2.0-flash-lite-preview-02-05",
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    defaultBaseUrl: "https://api.deepseek.com",
    description: "DeepSeek-V3, DeepSeek-R1 (доступные и мощные модели)",
    testModel: "deepseek-chat",
    defaultVisionModel: "deepseek-chat",
    defaultTextModel: "deepseek-chat",
    presetVisionModels: ["deepseek-chat"],
    presetTextModels: ["deepseek-chat", "deepseek-reasoner"],
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    defaultBaseUrl: "https://api.anthropic.com/v1",
    description: "Claude 3.5 Sonnet, Claude 3.5 Haiku",
    testModel: "claude-3-5-haiku-latest",
    defaultVisionModel: "claude-3-5-sonnet-latest",
    defaultTextModel: "claude-3-5-haiku-latest",
    presetVisionModels: [
      "claude-3-5-sonnet-latest",
      "claude-3-5-haiku-latest",
      "claude-3-opus-latest",
    ],
    presetTextModels: [
      "claude-3-5-haiku-latest",
      "claude-3-5-sonnet-latest",
      "claude-3-opus-latest",
    ],
  },
  {
    id: "groq",
    name: "Groq (Ultra-Fast LPU)",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    description: "Сверхбыстрый инференс (Llama 3.3, Mixtral)",
    testModel: "llama-3.1-8b-instant",
    defaultVisionModel: "llama-3.2-11b-vision-preview",
    defaultTextModel: "llama-3.3-70b-versatile",
    presetVisionModels: [
      "llama-3.2-11b-vision-preview",
      "llama-3.2-90b-vision-preview",
    ],
    presetTextModels: [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "deepseek-r1-distill-llama-70b",
      "mixtral-8x7b-32768",
    ],
  },
  {
    id: "mistral",
    name: "Mistral AI",
    defaultBaseUrl: "https://api.mistral.ai/v1",
    description: "Mistral Large, Pixtral (Vision)",
    testModel: "mistral-small-latest",
    defaultVisionModel: "pixtral-12b-2409",
    defaultTextModel: "mistral-small-latest",
    presetVisionModels: [
      "pixtral-12b-2409",
      "pixtral-large-latest",
    ],
    presetTextModels: [
      "mistral-small-latest",
      "mistral-large-latest",
      "codestral-latest",
      "open-mistral-nemo",
    ],
  },
  {
    id: "together",
    name: "Together AI",
    defaultBaseUrl: "https://api.together.xyz/v1",
    description: "Open-source модели на GPU облаке",
    testModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    defaultVisionModel: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
    defaultTextModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    presetVisionModels: [
      "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
      "meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo",
    ],
    presetTextModels: [
      "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      "deepseek-ai/DeepSeek-V3",
      "Qwen/Qwen2.5-72B-Instruct-Turbo",
      "google/gemma-2-27b-it",
    ],
  },
  {
    id: "cohere",
    name: "Cohere",
    defaultBaseUrl: "https://api.cohere.com/v2",
    description: "Command R+, Command R (RAG & Enterprise)",
    testModel: "command-r-08-2024",
    defaultVisionModel: "command-r-plus-08-2024",
    defaultTextModel: "command-r-08-2024",
    presetVisionModels: ["command-r-plus-08-2024"],
    presetTextModels: ["command-r-08-2024", "command-r-plus-08-2024", "command-light"],
  },
  {
    id: "nim",
    name: "NVIDIA NIM",
    defaultBaseUrl: "https://integrate.api.nvidia.com/v1",
    description: "Оптимизированные модели NVIDIA (Llama 3.3, Nemotron, DeepSeek)",
    testModel: "meta/llama-3.3-70b-instruct",
    defaultVisionModel: "meta/llama-3.2-11b-vision-instruct",
    defaultTextModel: "meta/llama-3.3-70b-instruct",
    presetVisionModels: [
      "meta/llama-3.2-11b-vision-instruct",
      "nvidia/neva-22b",
    ],
    presetTextModels: [
      "meta/llama-3.3-70b-instruct",
      "deepseek-ai/deepseek-r1",
      "nvidia/llama-3.1-nemotron-70b-instruct",
      "mistralai/mistral-large-2-instruct",
    ],
  },
  {
    id: "custom",
    name: "Кастомный (OpenAI-совместимый)",
    defaultBaseUrl: "",
    description: "Ollama, vLLM, LocalAI, Azure OpenAI или собственный прокси",
    testModel: "gpt-4o-mini",
    defaultVisionModel: "gpt-4o",
    defaultTextModel: "gpt-4o-mini",
    presetVisionModels: ["gpt-4o", "gpt-4-vision-preview"],
    presetTextModels: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
    requiresBaseUrl: true,
  },
];

export function getProviderDefinition(providerId: string): AIProviderDefinition {
  const found = TOP_AI_PROVIDERS.find((p) => p.id === providerId.toLowerCase());
  if (found) return found;

  return {
    id: providerId,
    name: providerId,
    defaultBaseUrl: "",
    description: "Пользовательский провайдер",
    testModel: "gpt-4o-mini",
    defaultVisionModel: "gpt-4o",
    defaultTextModel: "gpt-4o-mini",
    presetVisionModels: ["gpt-4o"],
    presetTextModels: ["gpt-4o-mini", "gpt-4o"],
    requiresBaseUrl: true,
  };
}

export function resolveBaseUrl(providerId: string, customBaseUrl?: string | null): string | undefined {
  if (customBaseUrl && customBaseUrl.trim()) {
    return customBaseUrl.trim().replace(/\/+$/, "");
  }
  const def = getProviderDefinition(providerId);
  return def.defaultBaseUrl || undefined;
}

export function isVisionCapableModel(modelId: string, rawModelObj?: any): boolean {
  const id = (modelId || "").toLowerCase();

  // Исключаем эмбеддинги, аудио и модерацию
  if (
    /embed|embedding|tts|whisper|dall-e|moderation|bge-|rerank|realtime/i.test(id)
  ) {
    return false;
  }

  // Если провайдер OpenRouter или Together с метаданными
  if (rawModelObj) {
    const modality = rawModelObj.architecture?.modality || rawModelObj.modality;
    if (typeof modality === "string" && (modality.includes("image") || modality.includes("multimodal"))) {
      return true;
    }
    if (rawModelObj.type === "image" || rawModelObj.supports_vision === true) {
      return true;
    }
  }

  // Паттерны известных Vision моделей
  const visionPatterns = [
    /vision/i,
    /\bvl\b/i,
    /qwen.*vl/i,
    /pixtral/i,
    /gpt-4o/i,
    /gpt-4-turbo/i,
    /gpt-4-vision/i,
    /\bo1\b/i,
    /\bo3\b/i,
    /gemini.*flash/i,
    /gemini.*pro/i,
    /gemini-2/i,
    /claude-3/i,
    /llava/i,
    /minicpm.*v/i,
    /internvl/i,
    /florence/i,
    /molmo/i,
    /neva/i,
    /omni/i,
    /llama-3\.2-(11|90)b/i,
  ];

  return visionPatterns.some((pattern) => pattern.test(id));
}

export function isTextChatModel(modelId: string): boolean {
  const id = (modelId || "").toLowerCase();
  // Исключаем эмбеддинги и аудио
  if (
    /embed|embedding|tts|whisper|dall-e|moderation|bge-|rerank/i.test(id)
  ) {
    return false;
  }
  return true;
}

/**
 * Получает динамический список моделей от API провайдера
 */
export async function fetchProviderModels(params: {
  provider: string;
  apiKey: string;
  baseUrl?: string | null;
}): Promise<{
  success: boolean;
  isPreset: boolean;
  visionModels: string[];
  textModels: string[];
  allModels: string[];
  total?: number;
  message?: string;
  error?: string;
}> {
  const { provider, apiKey, baseUrl: customUrl } = params;
  const def = getProviderDefinition(provider);
  const cleanApiKey = (apiKey || "").trim();
  const effectiveBaseUrl = resolveBaseUrl(provider, customUrl);

  if (!cleanApiKey && !effectiveBaseUrl) {
    const total = def.presetVisionModels.length + def.presetTextModels.length;
    return {
      success: true,
      isPreset: true,
      visionModels: def.presetVisionModels,
      textModels: def.presetTextModels,
      allModels: Array.from(new Set([...def.presetTextModels, ...def.presetVisionModels])),
      total,
      message: "Использованы стандартные пресеты (ключ не указан)",
    };
  }

  try {
    let rawModels: any[] = [];

    if (provider === "gemini") {
      // У Google Gemini модели запрашиваются через generativelanguage API c ключом в query/header
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanApiKey}`;
      const resp = await fetch(geminiUrl, {
        headers: {
          "x-goog-api-key": cleanApiKey,
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!resp.ok) {
        let errDetail = `${resp.status} ${resp.statusText}`;
        try {
          const errJson: any = await resp.json();
          if (errJson?.error?.message) {
            errDetail = errJson.error.message;
          }
        } catch {}
        throw new Error(`Google Gemini models API: ${errDetail}`);
      }

      const data: any = await resp.json();
      rawModels = Array.isArray(data?.models) ? data.models : [];
    } else if (provider === "anthropic") {
      const resp = await fetch(`${effectiveBaseUrl || "https://api.anthropic.com/v1"}/models`, {
        headers: {
          "x-api-key": cleanApiKey,
          "anthropic-version": "2023-06-01",
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!resp.ok) {
        let errDetail = `${resp.status} ${resp.statusText}`;
        try {
          const errJson: any = await resp.json();
          if (errJson?.error?.message) {
            errDetail = errJson.error.message;
          }
        } catch {}
        throw new Error(`Anthropic models API: ${errDetail}`);
      }

      const data: any = await resp.json();
      rawModels = Array.isArray(data?.data) ? data.data : [];
    } else {
      // Стандартный OpenAI-совместимый эндпоинт GET /models
      if (!effectiveBaseUrl) {
        throw new Error("Не указан Base URL для обращения к API");
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${cleanApiKey}`,
      };

      if (provider === "openrouter") {
        headers["HTTP-Referer"] = process.env.SITE_URL || "http://localhost:3000";
        headers["X-Title"] = "ATC Platform";
      }

      const resp = await fetch(`${effectiveBaseUrl}/models`, {
        headers,
        signal: AbortSignal.timeout(15000),
      });

      if (!resp.ok) {
        let errDetail = `${resp.status} ${resp.statusText}`;
        try {
          const errJson: any = await resp.json();
          if (errJson?.error?.message) {
            errDetail = errJson.error.message;
          } else if (errJson?.message) {
            errDetail = errJson.message;
          }
        } catch {}
        throw new Error(`Models API (${provider}): ${errDetail}`);
      }

      const data: any = await resp.json();
      if (Array.isArray(data?.data)) {
        rawModels = data.data;
      } else if (Array.isArray(data?.models)) {
        rawModels = data.models;
      } else if (Array.isArray(data)) {
        rawModels = data;
      }
    }

    if (rawModels.length === 0) {
      throw new Error("Провайдер вернул пустой список моделей");
    }

    const allModelIds: string[] = [];
    const visionModelIds: string[] = [];
    const textModelIds: string[] = [];

    for (const item of rawModels) {
      let id: string = item.id || item.name;
      if (!id || typeof id !== "string") continue;

      // Удаляем префикс "models/" (специфика Gemini API)
      id = id.replace(/^models\//, "");

      if (!isTextChatModel(id)) continue;

      allModelIds.push(id);
      textModelIds.push(id);

      if (isVisionCapableModel(id, item)) {
        visionModelIds.push(id);
      }
    }

    // Если vision моделей не определилось по паттернам, гарантируем наличие пресетов
    const finalVisionModels =
      visionModelIds.length > 0
        ? Array.from(new Set(visionModelIds)).sort()
        : def.presetVisionModels;
    const finalTextModels =
      textModelIds.length > 0
        ? Array.from(new Set(textModelIds)).sort()
        : def.presetTextModels;

    const total = allModelIds.length;

    return {
      success: true,
      isPreset: false,
      visionModels: finalVisionModels,
      textModels: finalTextModels,
      allModels: Array.from(new Set(allModelIds)).sort(),
      total,
      message: `Загружено моделей: ${total} (Vision: ${finalVisionModels.length}, Text: ${finalTextModels.length})`,
    };
  } catch (error: any) {
    const errorMsg = error.message || "Ошибка подключения к API моделей";
    console.warn(
      `[AI Providers] Failed to fetch models from ${provider}: ${errorMsg}. Falling back to presets.`
    );

    const total = def.presetVisionModels.length + def.presetTextModels.length;
    return {
      success: false,
      isPreset: true,
      visionModels: def.presetVisionModels,
      textModels: def.presetTextModels,
      allModels: Array.from(
        new Set([...def.presetTextModels, ...def.presetVisionModels])
      ),
      total,
      message: `Использованы пресеты: ${errorMsg}`,
      error: errorMsg,
    };
  }
}
