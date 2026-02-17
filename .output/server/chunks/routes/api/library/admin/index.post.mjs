import { g as defineEventHandler, G as requireAuth, h as createError, l as readMultipartFormData, w as getDbPool } from '../../../../_/nitro.mjs';
import { c as roleHasPermission, P as Permission } from '../../../../_/permissions.mjs';
import { b as getPDFPageCount, a as generateCover } from '../../../../_/pdfProcessor.mjs';
import { e as createBook } from '../../../../_/libraryRepository.mjs';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 } from 'uuid';
import 'grammy';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'mysql2/promise';
import 'bcryptjs';
import 'crypto';
import 'node:url';
import 'jsonwebtoken';
import 'pdf-lib';
import 'sharp';

const db = getDbPool();
const index_post = defineEventHandler(async (event) => {
  const user = requireAuth(event);
  if (!roleHasPermission(user.role, Permission.LIBRARY_UPLOAD)) {
    console.error(
      `[Library] Unauthorized upload attempt by user ${user.id} (${user.role})`
    );
    throw createError({
      statusCode: 403,
      message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u043A\u043D\u0438\u0433"
    });
  }
  console.log(
    `[Library] Book upload started by user ${user.id} (${user.username})`
  );
  try {
    const formData = await readMultipartFormData(event);
    if (!formData) {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0435 \u0444\u043E\u0440\u043C\u044B"
      });
    }
    let pdfFile = null;
    const metadata = {};
    for (const part of formData) {
      if (part.name === "file" && part.filename) {
        pdfFile = {
          filename: part.filename,
          data: Buffer.from(part.data)
        };
      } else if (part.name && part.data && !part.filename) {
        metadata[part.name] = Buffer.from(part.data).toString("utf-8");
      }
    }
    if (!pdfFile) {
      throw createError({
        statusCode: 400,
        message: "PDF \u0444\u0430\u0439\u043B \u043D\u0435 \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D"
      });
    }
    if (!metadata.title) {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u043D\u0438\u0433\u0438 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E"
      });
    }
    if (!pdfFile.filename.toLowerCase().endsWith(".pdf")) {
      throw createError({
        statusCode: 400,
        message: "\u0414\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u044B \u0442\u043E\u043B\u044C\u043A\u043E PDF \u0444\u0430\u0439\u043B\u044B"
      });
    }
    console.log(
      `[Library] Processing PDF: ${pdfFile.filename} (${(pdfFile.data.length / 1024 / 1024).toFixed(2)} MB)`
    );
    const uniqueFilename = `${v4()}.pdf`;
    const originalPath = join(
      process.cwd(),
      "storage",
      "library",
      "originals",
      uniqueFilename
    );
    await mkdir(join(process.cwd(), "storage", "library", "originals"), {
      recursive: true
    });
    await writeFile(originalPath, pdfFile.data);
    console.log(`[Library] Original PDF saved: ${originalPath}`);
    let pageCount = 0;
    try {
      pageCount = await getPDFPageCount(originalPath);
      console.log(`[Library] PDF page count: ${pageCount} pages`);
    } catch (error) {
      console.error(`[Library] Failed to extract PDF page count:`, error);
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C PDF \u0444\u0430\u0439\u043B. \u0412\u043E\u0437\u043C\u043E\u0436\u043D\u043E, \u0444\u0430\u0439\u043B \u043F\u043E\u0432\u0440\u0435\u0436\u0434\u0435\u043D."
      });
    }
    const bookData = {
      title: metadata.title,
      author: metadata.author || void 0,
      description: metadata.description || void 0,
      isbn: metadata.isbn || void 0,
      category: metadata.category || void 0,
      total_pages: pageCount,
      original_file_path: originalPath,
      file_size_bytes: pdfFile.data.length,
      uploaded_by: user.id,
      cover_path: void 0
    };
    const bookId = await createBook(bookData);
    console.log(`[Library] Book created in DB: ID ${bookId}`);
    try {
      const coverPath = await generateCover(bookId, originalPath);
      await db.execute(
        "UPDATE books SET cover_path = ?, status = ?, updated_at = NOW() WHERE id = ?",
        [coverPath, "ready", bookId]
      );
      console.log(
        `[Library] Book fully processed: ID ${bookId}, Cover: ${coverPath}`
      );
    } catch (error) {
      console.error(
        `[Library] Warning: Failed to generate cover for book ${bookId}:`,
        error
      );
      await db.execute(
        "UPDATE books SET status = ?, updated_at = NOW() WHERE id = ?",
        ["ready", bookId]
      );
    }
    console.log(
      `[Library] Book upload completed: ID ${bookId}, Title: "${bookData.title}"`
    );
    return {
      success: true,
      book: {
        id: bookId,
        title: bookData.title,
        author: bookData.author,
        pageCount: bookData.total_pages,
        processingStatus: "ready"
      }
    };
  } catch (error) {
    console.error(`[Library] Book upload failed:`, error);
    throw error;
  }
});

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
