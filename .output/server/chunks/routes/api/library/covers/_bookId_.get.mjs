import { g as defineEventHandler, j as getRouterParam, h as createError, f as executeQuery } from '../../../../_/nitro.mjs';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path__default from 'path';
import 'grammy';
import 'uuid';
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

const _bookId__get = defineEventHandler(async (event) => {
  const bookId = getRouterParam(event, "bookId");
  if (!bookId) {
    throw createError({
      statusCode: 400,
      message: "Book ID is required"
    });
  }
  try {
    const books = await executeQuery(
      "SELECT cover_path FROM books WHERE id = ? AND deleted_at IS NULL LIMIT 1",
      [bookId]
    );
    if (!books || books.length === 0) {
      throw createError({
        statusCode: 404,
        message: "Book not found"
      });
    }
    const book = books[0];
    if (!book.cover_path) {
      throw createError({
        statusCode: 404,
        message: "Cover not found"
      });
    }
    const coverPath = path__default.join(
      process.cwd(),
      "storage",
      "library",
      "covers",
      `${bookId}.webp`
    );
    if (!existsSync(coverPath)) {
      console.error(`[Library] Cover file not found: ${coverPath}`);
      throw createError({
        statusCode: 404,
        message: "Cover file not found"
      });
    }
    const coverBuffer = await readFile(coverPath);
    event.node.res.setHeader("Content-Type", "image/webp");
    event.node.res.setHeader("Cache-Control", "public, max-age=31536000");
    event.node.res.setHeader("Content-Length", coverBuffer.length);
    return coverBuffer;
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    console.error(`[Library] Failed to serve cover for book ${bookId}:`, error);
    throw createError({
      statusCode: 500,
      message: "Failed to load cover"
    });
  }
});

export { _bookId__get as default };
//# sourceMappingURL=_bookId_.get.mjs.map
