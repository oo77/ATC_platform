import { executeQuery, testConnection } from '../../utils/db';
import { verifyPassword, generateToken, generateRefreshToken, toPublicUser, createTokenPayload } from '../../utils/auth';
import { validate, loginSchema } from '../../utils/validation';
import { logActivityDirect } from '../../utils/activityLogger';
import { audit } from '../../utils/audit';
import type { User, LoginData, AuthResponse } from '../../types/auth';
import { withAccess } from '../../utils/roleRegistry';

/**
 * API endpoint для входа пользователя
 * POST /api/auth/login
 * 
 * Body: { email, password }
 */
export default defineEventHandler(async (event) => {
  // ====== DEBUG LOGGING START (TODO: remove after testing) ======
  const debugInfo: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_HOST: process.env.DATABASE_HOST ? '✓ set' : '✗ missing',
      DATABASE_PORT: process.env.DATABASE_PORT ? '✓ set' : '✗ missing',
      DATABASE_USER: process.env.DATABASE_USER ? '✓ set' : '✗ missing',
      DATABASE_PASSWORD: process.env.DATABASE_PASSWORD ? '✓ set (hidden)' : '✗ missing',
      DATABASE_NAME: process.env.DATABASE_NAME ? '✓ set' : '✗ missing',
      DATABASE_SSL: process.env.DATABASE_SSL,
      DATABASE_SSL_CA: process.env.DATABASE_SSL_CA ? '✓ set (length: ' + process.env.DATABASE_SSL_CA.length + ')' : '✗ missing',
    },
    steps: [] as string[]
  };

  console.log('🔍 [DEBUG] Login attempt started');
  console.log('🔍 [DEBUG] Environment check:', JSON.stringify(debugInfo.env, null, 2));
  // ====== DEBUG LOGGING END ======

  try {
    // Чтение тела запроса
    const body = await readBody<LoginData>(event);
    debugInfo.steps.push('1. Body read successfully');
    console.log('🔍 [DEBUG] Step 1: Body read, email:', body?.email);

    // Валидация данных
    const validation = validate(loginSchema, body);
    if (!validation.success) {
      debugInfo.steps.push('2. Validation FAILED');
      console.log('🔍 [DEBUG] Step 2: Validation failed:', validation.errors);
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation Error',
        data: {
          success: false,
          message: 'Ошибка валидации данных',
          errors: validation.errors
        },
      });
    }
    debugInfo.steps.push('2. Validation passed');
    console.log('🔍 [DEBUG] Step 2: Validation passed');

    const { email, password } = validation.data;

    // Проверка подключения к БД (DEBUG)
    console.log('🔍 [DEBUG] Step 3: Testing DB connection...');
    try {
      const dbConnected = await testConnection();
      debugInfo.steps.push(`3. DB connection test: ${dbConnected ? 'SUCCESS' : 'FAILED'}`);
      debugInfo.dbConnected = dbConnected;
      console.log('🔍 [DEBUG] Step 3: DB connection:', dbConnected);
    } catch (dbError: any) {
      debugInfo.steps.push(`3. DB connection test: ERROR - ${dbError.message}`);
      debugInfo.dbError = dbError.message;
      console.error('🔍 [DEBUG] Step 3: DB connection error:', dbError.message);
      throw createError({
        statusCode: 500,
        statusMessage: 'Database Connection Error',
        data: {
          success: false,
          message: 'Ошибка подключения к базе данных'
        },
      });
    }

    // Поиск пользователя по email
    console.log('🔍 [DEBUG] Step 4: Querying user by email...');
    const users = await executeQuery<User[]>(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    debugInfo.steps.push(`4. User query: found ${users.length} users`);
    console.log('🔍 [DEBUG] Step 4: Found users:', users.length);

    if (users.length === 0) {
      await audit(event, {
        action: "auth.login_failed",
        category: "security",
        outcome: "denied",
        summary: `Неудачный вход: неизвестный email ${email}`,
        entity: { type: "USER", label: email },
        metadata: { reason: "unknown_email" },
      });
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid Credentials',
        data: {
          success: false,
          message: 'Неверный email или пароль',
          errors: { _general: ['Неверный email или пароль'] }
        },
      });
    }

    const user = users[0];

    // Дополнительная проверка для TypeScript (хотя логически user всегда существует после проверки выше)
    if (!user) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal Server Error',
        data: {
          success: false,
          message: 'Ошибка получения данных пользователя'
        },
      });
    }

    debugInfo.steps.push(`5. User found: ${user.email} (role: ${user.role})`);
    console.log('🔍 [DEBUG] Step 5: User found:', user.email, 'role:', user.role);

    // Проверка пароля
    console.log('🔍 [DEBUG] Step 6: Verifying password...');
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    debugInfo.steps.push(`6. Password verification: ${isPasswordValid ? 'VALID' : 'INVALID'}`);
    console.log('🔍 [DEBUG] Step 6: Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      await audit(event, {
        action: "auth.login_failed",
        category: "security",
        outcome: "denied",
        summary: `Неудачный вход: неверный пароль для ${user.email}`,
        entity: { type: "USER", id: user.id, label: user.email },
        actor: { id: user.id, name: user.name, roleName: user.role },
        metadata: { reason: "wrong_password" },
      });
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid Credentials',
        data: {
          success: false,
          message: 'Неверный email или пароль',
          errors: { _general: ['Неверный email или пароль'] }
        },
      });
    }

    // Генерация токенов
    console.log('🔍 [DEBUG] Step 7: Generating tokens...');
    const tokenPayload = createTokenPayload(user);
    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    debugInfo.steps.push('7. Tokens generated successfully');
    console.log('🔍 [DEBUG] Step 7: Tokens generated');

    // Возврат ответа
    const response: AuthResponse = {
      success: true,
      user: await withAccess(toPublicUser(user)),
      token,
      refreshToken,
    };

    console.log(`✅ User logged in: ${user.email} (${user.role})`);
    console.log('🔍 [DEBUG] Login SUCCESS! All steps completed:', debugInfo.steps);

    // Логируем вход (используем Direct, т.к. user ещё не в context)
    await logActivityDirect(
      user.id,
      'LOGIN',
      'SYSTEM',
      user.id,
      user.name
    );

    return response;
  } catch (error: any) {
    console.error('❌ [DEBUG] Login error:', error.message);
    console.error('❌ [DEBUG] Error stack:', error.stack);
    console.error('❌ [DEBUG] Debug info:', JSON.stringify(debugInfo, null, 2));

    // Если ошибка уже создана через createError, пробрасываем её
    if (error.statusCode) {
      // Отладочные шаги в ответ НЕ отдаём: по ним можно было перебирать существующие email
      throw error;
    }

    // Иначе — общая ошибка без внутренних подробностей (они в логе сервера)
    throw createError({
      statusCode: 500,
      statusMessage: 'Login Failed',
      data: {
        success: false,
        message: 'Ошибка при входе в систему',
      },
    });
  }
});
