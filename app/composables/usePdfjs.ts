/**
 * Ленивая загрузка pdf.js с локальным воркером.
 *
 * Раньше воркер грузился с cdn.jsdelivr.net — лишний сторонний домен
 * (и точка отказа). Теперь Vite кладёт воркер в сборку проекта.
 */
let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

export function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const [pdfjs, worker] = await Promise.all([
        import("pdfjs-dist"),
        // @ts-ignore — Vite отдаёт URL файла через ?url
        import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
      ]);
      pdfjs.GlobalWorkerOptions.workerSrc = (worker as any).default;
      return pdfjs;
    })().catch((err) => {
      pdfjsPromise = null;
      throw err;
    });
  }
  return pdfjsPromise;
}

// ------------------------------------------------------------------
// Обложки: первая страница PDF → картинка, с кэшем и ограничением
// параллельности (каталог может показать десятки обложек сразу)
// ------------------------------------------------------------------

const coverCache = new Map<string, Promise<string | null>>();
const MAX_PARALLEL = 3;
let running = 0;
const queue: (() => void)[] = [];

function schedule<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      running++;
      task()
        .then(resolve, reject)
        .finally(() => {
          running--;
          queue.shift()?.();
        });
    };
    if (running < MAX_PARALLEL) run();
    else queue.push(run);
  });
}

async function renderCover(url: string, width: number): Promise<string | null> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) return null;
  const type = res.headers.get("content-type") || "";
  const blob = await res.blob();

  // Уже картинка (png/webp от старых версий) — отдаём как есть
  if (type.startsWith("image/")) return URL.createObjectURL(blob);

  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
  try {
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const scale = (width * Math.min(window.devicePixelRatio || 1, 2)) / base.width;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d", { alpha: false })!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
    const out = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.85));
    return out ? URL.createObjectURL(out) : null;
  } finally {
    doc.destroy();
  }
}

/** URL картинки обложки (object URL) или null, если обложки нет */
export function getCoverImage(url: string, width = 240): Promise<string | null> {
  const key = `${url}|${width}`;
  let p = coverCache.get(key);
  if (!p) {
    p = schedule(() => renderCover(url, width)).catch(() => null);
    coverCache.set(key, p);
  }
  return p;
}
