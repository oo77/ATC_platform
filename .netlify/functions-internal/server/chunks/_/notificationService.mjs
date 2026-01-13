import { H as getRepresentativeById, L as sendMessage, M as BOT_MESSAGES } from '../nitro/nitro.mjs';

async function notifyRepresentativeAboutApproval(representativeId) {
  try {
    const representative = await getRepresentativeById(representativeId);
    if (!representative || !representative.telegramChatId) {
      console.warn(`[NotificationService] \u041F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044C ${representativeId} \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0438\u043B\u0438 \u043D\u0435\u0442 Telegram`);
      return false;
    }
    const result = await sendMessage(
      representative.telegramChatId,
      BOT_MESSAGES.NOTIFICATION_APPROVED
    );
    console.log(`[NotificationService] \u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0435 \u043E\u0431 \u043E\u0434\u043E\u0431\u0440\u0435\u043D\u0438\u0438 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E: ${representativeId}`);
    return result;
  } catch (error) {
    console.error("[NotificationService] \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u043E\u0431 \u043E\u0434\u043E\u0431\u0440\u0435\u043D\u0438\u0438:", error);
    return false;
  }
}
async function notifyRepresentativeAboutBlock(representativeId, reason) {
  try {
    const representative = await getRepresentativeById(representativeId);
    if (!representative || !representative.telegramChatId) {
      console.warn(`[NotificationService] \u041F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044C ${representativeId} \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0438\u043B\u0438 \u043D\u0435\u0442 Telegram`);
      return false;
    }
    const result = await sendMessage(
      representative.telegramChatId,
      BOT_MESSAGES.NOTIFICATION_BLOCKED(reason)
    );
    console.log(`[NotificationService] \u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0435 \u043E \u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u043A\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E: ${representativeId}`);
    return result;
  } catch (error) {
    console.error("[NotificationService] \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u043E \u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u043A\u0435:", error);
    return false;
  }
}

export { notifyRepresentativeAboutBlock as a, notifyRepresentativeAboutApproval as n };
//# sourceMappingURL=notificationService.mjs.map
