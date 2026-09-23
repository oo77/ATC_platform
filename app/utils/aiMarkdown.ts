/**
 * Лёгкий и безопасный рендерер Markdown для ответов ИИ.
 * Сначала экранирует HTML, затем поддерживает: **жирный**, *курсив*, `код`,
 * заголовки, списки, цитаты, таблицы, блоки кода и ссылки (http/https и относительные).
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInline(text: string): string {
  let s = escapeHtml(text);
  const codes: string[] = [];
  // Инлайн-код выносим, чтобы внутри не срабатывало форматирование
  s = s.replace(/`([^`\n]+)`/g, (_, c) => {
    codes.push(`<code class="ai-md-code">${c}</code>`);
    return `\x00${codes.length - 1}\x00`;
  });
  s = s.replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__([^_\n]+?)__/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*\w])\*([^*\n]+?)\*(?!\w)/g, "$1<em>$2</em>");
  s = s.replace(/~~([^~\n]+?)~~/g, "<del>$1</del>");
  s = s.replace(/\[([^\]\n]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g, (_, label, url) => {
    const external = /^https?:/.test(url);
    return `<a href="${url}" class="ai-md-link"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${label}</a>`;
  });
  // Оставшиеся одиночные ** (незакрытые) не показываем как мусор
  s = s.replace(/\*\*/g, "");
  s = s.replace(/\x00(\d+)\x00/g, (_, i) => codes[Number(i)] ?? "");
  return s;
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

export function renderAiMarkdown(src: string): string {
  const lines = String(src || "").replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    // Блок кода
    if (/^\s*```/.test(line)) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i]!)) buf.push(lines[i++]!);
      i++;
      out.push(`<pre class="ai-md-pre"><code>${escapeHtml(buf.join("\n"))}</code></pre>`);
      continue;
    }

    // Таблица: строка с | и строка-разделитель ---
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(lines[i + 1]!)) {
      const head = splitRow(line);
      i += 2;
      const body: string[][] = [];
      while (i < lines.length && lines[i]!.includes("|") && lines[i]!.trim()) body.push(splitRow(lines[i++]!));
      out.push(
        `<div class="ai-md-table-wrap"><table class="ai-md-table"><thead><tr>${head.map((h) => `<th>${renderInline(h)}</th>`).join("")}</tr></thead><tbody>` +
          body.map((r) => `<tr>${r.map((c) => `<td>${renderInline(c)}</td>`).join("")}</tr>`).join("") +
          "</tbody></table></div>",
      );
      continue;
    }

    // Заголовки
    const h = line.match(/^\s*(#{1,4})\s+(.+)$/);
    if (h) {
      const level = Math.min(h[1]!.length + 2, 6);
      out.push(`<h${level} class="ai-md-h">${renderInline(h[2]!)}</h${level}>`);
      i++;
      continue;
    }

    // Цитата
    if (/^\s*>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i]!)) buf.push(lines[i++]!.replace(/^\s*>\s?/, ""));
      out.push(`<blockquote class="ai-md-quote">${buf.map(renderInline).join("<br>")}</blockquote>`);
      continue;
    }

    // Списки (маркированные и нумерованные)
    if (/^\s*([-*•]|\d+[.)])\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*•]|\d+[.)])\s+/.test(lines[i]!)) {
        const isOrdered = /^\s*\d+[.)]\s+/.test(lines[i]!);
        if (isOrdered !== ordered) break;
        items.push(lines[i++]!.replace(/^\s*([-*•]|\d+[.)])\s+/, ""));
      }
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag} class="ai-md-${tag}">${items.map((it) => `<li>${renderInline(it)}</li>`).join("")}</${tag}>`);
      continue;
    }

    // Разделитель
    if (/^\s*(---|\*\*\*)\s*$/.test(line)) {
      out.push('<hr class="ai-md-hr">');
      i++;
      continue;
    }

    // Пустая строка
    if (!line.trim()) {
      i++;
      continue;
    }

    // Абзац: собираем подряд идущие обычные строки
    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i]!.trim() &&
      !/^\s*(```|#{1,4}\s|>|([-*•]|\d+[.)])\s+)/.test(lines[i]!) &&
      !(lines[i]!.includes("|") && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1]!))
    ) {
      buf.push(lines[i++]!);
    }
    out.push(`<p class="ai-md-p">${buf.map(renderInline).join("<br>")}</p>`);
  }

  return out.join("");
}
