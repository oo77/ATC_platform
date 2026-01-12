import { e as executeQuery } from '../nitro/nitro.mjs';

function mapRowToFile(row) {
  return {
    id: row.id,
    uuid: row.uuid,
    filename: row.filename,
    storedName: row.stored_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    extension: row.extension,
    storagePath: row.storage_path,
    fullPath: row.full_path,
    category: row.category,
    userId: row.user_id,
    courseId: row.course_id,
    groupId: row.group_id,
    assignmentId: row.assignment_id,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
    isPublic: row.is_public,
    accessLevel: row.access_level,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at
  };
}
async function createFile(data) {
  const now = /* @__PURE__ */ new Date();
  await executeQuery(
    `INSERT INTO files (
      uuid, filename, stored_name, mime_type, size_bytes, extension,
      storage_path, full_path, category, folder_id,
      user_id, course_id, group_id, assignment_id, metadata,
      is_public, access_level, uploaded_by,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.uuid,
      data.filename,
      data.storedName,
      data.mimeType,
      data.sizeBytes,
      data.extension,
      data.storagePath,
      data.fullPath,
      data.category,
      data.folderId || null,
      data.userId || null,
      data.courseId || null,
      data.groupId || null,
      data.assignmentId || null,
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.isPublic || false,
      data.accessLevel || "authenticated",
      data.uploadedBy,
      now,
      now
    ]
  );
  const file = await getFileByUuid(data.uuid);
  if (!file) {
    throw new Error("Failed to create file record");
  }
  return file;
}
async function getFileByUuid(uuid) {
  const rows = await executeQuery(
    "SELECT * FROM files WHERE uuid = ? AND deleted_at IS NULL LIMIT 1",
    [uuid]
  );
  if (rows.length === 0) {
    return null;
  }
  return mapRowToFile(rows[0]);
}
async function getFilesPaginated(params = {}) {
  const {
    page = 1,
    limit = 20,
    search,
    category,
    userId,
    courseId,
    groupId,
    uploadedBy
  } = params;
  const conditions = ["deleted_at IS NULL"];
  const queryParams = [];
  if (search) {
    conditions.push("filename LIKE ?");
    queryParams.push(`%${search}%`);
  }
  if (category) {
    conditions.push("category = ?");
    queryParams.push(category);
  }
  if (userId) {
    conditions.push("user_id = ?");
    queryParams.push(userId);
  }
  if (courseId) {
    conditions.push("course_id = ?");
    queryParams.push(courseId);
  }
  if (groupId) {
    conditions.push("group_id = ?");
    queryParams.push(groupId);
  }
  if (uploadedBy) {
    conditions.push("uploaded_by = ?");
    queryParams.push(uploadedBy);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const countQuery = `SELECT COUNT(*) as total FROM files ${whereClause}`;
  const countResult = await executeQuery(countQuery, queryParams);
  const total = countResult[0]?.total || 0;
  const offset = (page - 1) * limit;
  const dataQuery = `
    SELECT * FROM files 
    ${whereClause} 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `;
  const dataParams = [...queryParams, limit, offset];
  const rows = await executeQuery(dataQuery, dataParams);
  const files = rows.map(mapRowToFile);
  return {
    data: files,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}
async function deleteFile(uuid) {
  const now = /* @__PURE__ */ new Date();
  const result = await executeQuery(
    "UPDATE files SET deleted_at = ? WHERE uuid = ? AND deleted_at IS NULL",
    [now, uuid]
  );
  return result.affectedRows > 0;
}
async function updateFile(id, updates) {
  const now = /* @__PURE__ */ new Date();
  const fields = [];
  const values = [];
  if (updates.filename !== void 0) {
    fields.push("filename = ?");
    values.push(updates.filename);
  }
  if (fields.length === 0) {
    return false;
  }
  fields.push("updated_at = ?");
  values.push(now);
  values.push(id);
  const query = `UPDATE files SET ${fields.join(", ")} WHERE id = ? AND deleted_at IS NULL`;
  const result = await executeQuery(query, values);
  return result.affectedRows > 0;
}

export { getFilesPaginated as a, createFile as c, deleteFile as d, getFileByUuid as g, updateFile as u };
//# sourceMappingURL=fileRepository.mjs.map
