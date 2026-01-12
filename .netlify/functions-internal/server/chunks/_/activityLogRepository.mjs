import { e as executeQuery } from '../nitro/nitro.mjs';

function mapRowToActivityLog(row) {
  let details = null;
  if (row.details) {
    try {
      details = typeof row.details === "string" ? JSON.parse(row.details) : row.details;
    } catch {
      details = null;
    }
  }
  return {
    id: row.id,
    userId: row.user_id,
    actionType: row.action_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityName: row.entity_name,
    details,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: row.created_at
  };
}
async function createActivityLog(data) {
  const detailsJson = data.details ? JSON.stringify(data.details) : null;
  console.log("[createActivityLog] Attempting to insert:", {
    userId: data.userId,
    actionType: data.actionType,
    entityType: data.entityType,
    entityId: data.entityId,
    entityName: data.entityName
  });
  const result = await executeQuery(
    `INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, entity_name, details, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.userId,
      data.actionType,
      data.entityType,
      data.entityId || null,
      data.entityName || null,
      detailsJson,
      data.ipAddress || null,
      data.userAgent || null
    ]
  );
  const rows = await executeQuery(
    "SELECT * FROM activity_logs WHERE id = ?",
    [result.insertId]
  );
  return mapRowToActivityLog(rows[0]);
}
async function getActivityLogsPaginated(params = {}) {
  const {
    page = 1,
    limit = 20,
    userId,
    actionType,
    entityType,
    startDate,
    endDate
  } = params;
  const conditions = [];
  const queryParams = [];
  if (userId) {
    conditions.push("user_id = ?");
    queryParams.push(userId);
  }
  if (actionType) {
    conditions.push("action_type = ?");
    queryParams.push(actionType);
  }
  if (entityType) {
    conditions.push("entity_type = ?");
    queryParams.push(entityType);
  }
  if (startDate) {
    conditions.push("created_at >= ?");
    const date = startDate instanceof Date ? startDate : new Date(startDate);
    queryParams.push(date);
  }
  if (endDate) {
    conditions.push("created_at <= ?");
    const date = endDate instanceof Date ? endDate : new Date(endDate);
    queryParams.push(date);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const countQuery = `SELECT COUNT(*) as total FROM activity_logs ${whereClause}`;
  const countResult = await executeQuery(countQuery, queryParams);
  const total = countResult[0]?.total || 0;
  const offset = (page - 1) * limit;
  const dataQuery = `
    SELECT * FROM activity_logs 
    ${whereClause} 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `;
  const dataParams = [...queryParams, limit, offset];
  const rows = await executeQuery(dataQuery, dataParams);
  return {
    data: rows.map(mapRowToActivityLog),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}
async function getActivityLogsByUserId(userId, page = 1, limit = 20) {
  return getActivityLogsPaginated({ userId, page, limit });
}
async function getUserActivityStats(userId) {
  const totalRows = await executeQuery(
    "SELECT COUNT(*) as total FROM activity_logs WHERE user_id = ?",
    [userId]
  );
  const totalActions = totalRows[0]?.total || 0;
  const actionRows = await executeQuery(
    `SELECT action_type, COUNT(*) as count 
     FROM activity_logs 
     WHERE user_id = ? 
     GROUP BY action_type`,
    [userId]
  );
  const actionsByType = {
    CREATE: 0,
    UPDATE: 0,
    DELETE: 0,
    VIEW: 0,
    LOGIN: 0,
    LOGOUT: 0,
    IMPORT: 0,
    EXPORT: 0
  };
  for (const row of actionRows) {
    actionsByType[row.action_type] = row.count;
  }
  const lastRows = await executeQuery(
    `SELECT created_at FROM activity_logs 
     WHERE user_id = ? 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [userId]
  );
  const lastActivity = lastRows.length > 0 ? lastRows[0].created_at : null;
  return {
    totalActions,
    actionsByType,
    lastActivity
  };
}

export { getActivityLogsByUserId as a, getUserActivityStats as b, createActivityLog as c, getActivityLogsPaginated as g };
//# sourceMappingURL=activityLogRepository.mjs.map
