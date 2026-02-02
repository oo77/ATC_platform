import { testConnection } from '../utils/db';

export default defineNitroPlugin(async (nitroApp) => {
  console.log('🔌 Инициализация подключения к MySQL...');
  
  const connected = await testConnection();
  
  if (!connected) {
    console.error('⚠️  Не удалось подключиться к MySQL. Проверьте настройки в .env файле.');
    console.error('⚠️  Приложение будет работать, но запросы к базе данных будут падать.');
  }
});
