import { q as getRequestIP, l as getHeader } from '../nitro/nitro.mjs';
import { c as createActivityLog } from './activityLogRepository.mjs';

async function logActivity(event, actionType, entityType, entityId, entityName, details) {
  try {
    const user = event.context.user;
    if (!user?.id) {
      console.warn("[Activity Log] User not found in context, skipping log");
      return;
    }
    const ipAddress = getRequestIP(event, { xForwardedFor: true }) || null;
    const userAgent = getHeader(event, "user-agent") || null;
    const logData = {
      userId: user.id,
      actionType,
      entityType,
      entityId,
      entityName,
      details,
      ipAddress: ipAddress || void 0,
      userAgent: userAgent || void 0
    };
    await createActivityLog(logData);
    console.log(`[Activity Log] ${actionType} ${entityType} by user ${user.id}`);
  } catch (error) {
    console.error("[Activity Log] Failed to create activity log:", error);
  }
}
async function logActivityDirect(userId, actionType, entityType, entityId, entityName, details) {
  try {
    await createActivityLog({
      userId,
      actionType,
      entityType,
      entityId,
      entityName,
      details
    });
    console.log(`[Activity Log] ${actionType} ${entityType} by user ${userId}`);
  } catch (error) {
    console.error("[Activity Log] Failed to create activity log:", error);
  }
}

export { logActivityDirect as a, logActivity as l };
//# sourceMappingURL=activityLogger.mjs.map
