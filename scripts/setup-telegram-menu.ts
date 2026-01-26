import { Bot } from 'grammy';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const domain = process.env.NGROK_DOMAIN;

if (!token) {
    console.error('❌ Ошибка: TELEGRAM_BOT_TOKEN не найден в .env');
    process.exit(1);
}

if (!domain) {
    console.error('❌ Ошибка: NGROK_DOMAIN не найден в .env');
    process.exit(1);
}

const bot = new Bot(token);
// HTTPS обязательно для Web App
const webAppUrl = `https://${domain}/tg-app`;

async function setup() {
    console.log('🤖 Настройка Telegram бота...');
    console.log(`📡 URL приложения: ${webAppUrl}`);

    try {
        // 1. Устанавливаем кнопку меню
        await bot.api.setChatMenuButton({
            menu_button: {
                type: 'web_app',
                text: 'Открыть платформу',
                web_app: { url: webAppUrl },
            },
        });
        console.log('✅ Кнопка меню (слева от ввода текста) успешно настроена!');

        // 2. Дополнительно: можно отправить ссылку в чат (для теста)
        // Но кнопка меню важнее, так как она персистентная

        console.log('\n🎉 Готово! Теперь зайдите в бота и нажмите кнопку "Открыть платформу" (или "Menu" слева внизу).');
        console.log('❗ Важно: Не просто кликайте по ссылке, а используйте именно эту кнопку меню.');

    } catch (error) {
        console.error('❌ Ошибка настройки:', error);
    }
}

setup();
