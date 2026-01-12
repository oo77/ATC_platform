import { e as executeQuery } from '../nitro/nitro.mjs';
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
import 'jsonwebtoken';

function mapRowToFolder(row) {
  return {
    id: row.id,
    uuid: row.uuid,
    name: row.name,
    parentId: row.parent_id,
    path: row.path,
    userId: row.user_id,
    isSystem: row.is_system,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at
  };
}
async function createFolder(data) {
  const uuid = v4();
  const now = /* @__PURE__ */ new Date();
  let parentPath = "";
  if (data.parentId) {
    const parent = await getFolderById(data.parentId);
    if (!parent) {
      throw new Error("Parent folder not found");
    }
    parentPath = parent.path;
  }
  const fullPath = parentPath ? `${parentPath}/${data.name}` : `/${data.name}`;
  await executeQuery(
    `INSERT INTO folders (uuid, name, parent_id, path, user_id, is_system, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [uuid, data.name, data.parentId || null, fullPath, data.userId || null, data.isSystem || false, now, now]
  );
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const relativePath = fullPath.startsWith("/") ? fullPath.substring(1) : fullPath;
    const physicalPath = path.resolve(process.cwd(), "storage/uploads", relativePath);
    await fs.mkdir(physicalPath, { recursive: true });
    console.log(`\u2713 \u0424\u0438\u0437\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043F\u0430\u043F\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0430: ${physicalPath}`);
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0444\u0438\u0437\u0438\u0447\u0435\u0441\u043A\u043E\u0439 \u043F\u0430\u043F\u043A\u0438:", error);
  }
  const folder = await getFolderByUuid(uuid);
  if (!folder) {
    throw new Error("Failed to create folder");
  }
  return folder;
}
async function getFolderById(id) {
  const rows = await executeQuery(
    "SELECT * FROM folders WHERE id = ? AND deleted_at IS NULL LIMIT 1",
    [id]
  );
  if (rows.length === 0) {
    return null;
  }
  return mapRowToFolder(rows[0]);
}
async function getFolderByUuid(uuid) {
  const rows = await executeQuery(
    "SELECT * FROM folders WHERE uuid = ? AND deleted_at IS NULL LIMIT 1",
    [uuid]
  );
  if (rows.length === 0) {
    return null;
  }
  return mapRowToFolder(rows[0]);
}
async function getFolderByPath(path) {
  const rows = await executeQuery(
    "SELECT * FROM folders WHERE path = ? AND deleted_at IS NULL LIMIT 1",
    [path]
  );
  if (rows.length === 0) {
    return null;
  }
  return mapRowToFolder(rows[0]);
}
async function getSubFolders(parentId = null) {
  const query = parentId === null ? "SELECT * FROM folders WHERE parent_id IS NULL AND deleted_at IS NULL ORDER BY is_system DESC, name ASC" : "SELECT * FROM folders WHERE parent_id = ? AND deleted_at IS NULL ORDER BY is_system DESC, name ASC";
  const params = parentId === null ? [] : [parentId];
  const rows = await executeQuery(query, params);
  return rows.map(mapRowToFolder);
}
async function getRootFolders() {
  return getSubFolders(null);
}
async function renameFolder(id, newName) {
  const folder = await getFolderById(id);
  if (!folder) {
    return false;
  }
  if (folder.isSystem) {
    throw new Error("Cannot rename system folder");
  }
  const oldPath = folder.path;
  const pathParts = oldPath.split("/").filter(Boolean);
  pathParts[pathParts.length - 1] = newName;
  const newPath = "/" + pathParts.join("/");
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const oldRelativePath = oldPath.startsWith("/") ? oldPath.substring(1) : oldPath;
    const newRelativePath = newPath.startsWith("/") ? newPath.substring(1) : newPath;
    const oldPhysicalPath = path.resolve(process.cwd(), "storage/uploads", oldRelativePath);
    const newPhysicalPath = path.resolve(process.cwd(), "storage/uploads", newRelativePath);
    try {
      await fs.access(oldPhysicalPath);
      await fs.rename(oldPhysicalPath, newPhysicalPath);
      console.log(`\u2713 \u0424\u0438\u0437\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043F\u0430\u043F\u043A\u0430 \u043F\u0435\u0440\u0435\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0430: ${oldPhysicalPath} \u2192 ${newPhysicalPath}`);
    } catch (error) {
      console.warn("\u0424\u0438\u0437\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043F\u0430\u043F\u043A\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430 \u0438\u043B\u0438 \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u043F\u0435\u0440\u0435\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0430:", error);
    }
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0435\u0440\u0435\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u044F \u0444\u0438\u0437\u0438\u0447\u0435\u0441\u043A\u043E\u0439 \u043F\u0430\u043F\u043A\u0438:", error);
  }
  const result = await executeQuery(
    "UPDATE folders SET name = ?, path = ?, updated_at = ? WHERE id = ?",
    [newName, newPath, /* @__PURE__ */ new Date(), id]
  );
  await executeQuery(
    `UPDATE folders 
     SET path = CONCAT(?, SUBSTRING(path, ?)), updated_at = ?
     WHERE path LIKE ? AND id != ?`,
    [newPath, oldPath.length + 1, /* @__PURE__ */ new Date(), `${oldPath}/%`, id]
  );
  return result.affectedRows > 0;
}
async function moveFolder(id, newParentId) {
  const folder = await getFolderById(id);
  if (!folder) {
    return false;
  }
  if (folder.isSystem) {
    throw new Error("Cannot move system folder");
  }
  let newParentPath = "";
  if (newParentId) {
    const newParent = await getFolderById(newParentId);
    if (!newParent) {
      throw new Error("New parent folder not found");
    }
    if (newParent.path.startsWith(folder.path + "/")) {
      throw new Error("Cannot move folder into its own subfolder");
    }
    newParentPath = newParent.path;
  }
  const oldPath = folder.path;
  const newPath = newParentPath ? `${newParentPath}/${folder.name}` : `/${folder.name}`;
  const result = await executeQuery(
    "UPDATE folders SET parent_id = ?, path = ?, updated_at = ? WHERE id = ?",
    [newParentId, newPath, /* @__PURE__ */ new Date(), id]
  );
  await executeQuery(
    `UPDATE folders 
     SET path = CONCAT(?, SUBSTRING(path, ?)), updated_at = ?
     WHERE path LIKE ? AND id != ?`,
    [newPath, oldPath.length + 1, /* @__PURE__ */ new Date(), `${oldPath}/%`, id]
  );
  return result.affectedRows > 0;
}

export { createFolder, getFolderById, getFolderByPath, getFolderByUuid, getRootFolders, getSubFolders, moveFolder, renameFolder };
//# sourceMappingURL=folderRepository.mjs.map
