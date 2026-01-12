import { z } from 'zod';
import { U as UserRole } from '../nitro/nitro.mjs';

const emailSchema = z.string().email("\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 email").min(5, "Email \u0434\u043E\u043B\u0436\u0435\u043D \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C \u043C\u0438\u043D\u0438\u043C\u0443\u043C 5 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432").max(191, "Email \u043D\u0435 \u0434\u043E\u043B\u0436\u0435\u043D \u043F\u0440\u0435\u0432\u044B\u0448\u0430\u0442\u044C 191 \u0441\u0438\u043C\u0432\u043E\u043B");
const passwordSchema = z.string().min(6, "\u041F\u0430\u0440\u043E\u043B\u044C \u0434\u043E\u043B\u0436\u0435\u043D \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C \u043C\u0438\u043D\u0438\u043C\u0443\u043C 6 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432").max(100, "\u041F\u0430\u0440\u043E\u043B\u044C \u043D\u0435 \u0434\u043E\u043B\u0436\u0435\u043D \u043F\u0440\u0435\u0432\u044B\u0448\u0430\u0442\u044C 100 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432").regex(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  "\u041F\u0430\u0440\u043E\u043B\u044C \u0434\u043E\u043B\u0436\u0435\u043D \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C \u043C\u0438\u043D\u0438\u043C\u0443\u043C \u043E\u0434\u043D\u0443 \u0437\u0430\u0433\u043B\u0430\u0432\u043D\u0443\u044E \u0431\u0443\u043A\u0432\u0443, \u043E\u0434\u043D\u0443 \u0441\u0442\u0440\u043E\u0447\u043D\u0443\u044E \u0431\u0443\u043A\u0432\u0443 \u0438 \u043E\u0434\u043D\u0443 \u0446\u0438\u0444\u0440\u0443"
);
const nameSchema = z.string().min(2, "\u0418\u043C\u044F \u0434\u043E\u043B\u0436\u043D\u043E \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C \u043C\u0438\u043D\u0438\u043C\u0443\u043C 2 \u0441\u0438\u043C\u0432\u043E\u043B\u0430").max(191, "\u0418\u043C\u044F \u043D\u0435 \u0434\u043E\u043B\u0436\u043D\u043E \u043F\u0440\u0435\u0432\u044B\u0448\u0430\u0442\u044C 191 \u0441\u0438\u043C\u0432\u043E\u043B").regex(/^[а-яА-ЯёЁa-zA-Z\s'-]+$/, "\u0418\u043C\u044F \u043C\u043E\u0436\u0435\u0442 \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C \u0442\u043E\u043B\u044C\u043A\u043E \u0431\u0443\u043A\u0432\u044B, \u043F\u0440\u043E\u0431\u0435\u043B\u044B, \u0434\u0435\u0444\u0438\u0441\u044B \u0438 \u0430\u043F\u043E\u0441\u0442\u0440\u043E\u0444\u044B");
const phoneSchema = z.string().regex(
  /^\+998[0-9]{9}$/,
  "\u0422\u0435\u043B\u0435\u0444\u043E\u043D \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 +998XXXXXXXXX"
).optional();
const pinflSchema = z.string().regex(/^[0-9]{14}$/, "\u041F\u0418\u041D\u0424\u041B \u0434\u043E\u043B\u0436\u0435\u043D \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C 14 \u0446\u0438\u0444\u0440").optional();
const roleSchema = z.nativeEnum(UserRole).describe("\u0420\u043E\u043B\u044C \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F");
const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
  workplace: z.string().max(191).optional(),
  position: z.string().max(191).optional(),
  pinfl: pinflSchema,
  role: roleSchema.optional()
});
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "\u041F\u0430\u0440\u043E\u043B\u044C \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D")
});
const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  phone: phoneSchema,
  workplace: z.string().max(191).optional(),
  position: z.string().max(191).optional(),
  pinfl: pinflSchema
});
z.object({
  currentPassword: z.string().min(1, "\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u043F\u0430\u0440\u043E\u043B\u044C \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435 \u043F\u0430\u0440\u043E\u043B\u044F \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "\u041F\u0430\u0440\u043E\u043B\u0438 \u043D\u0435 \u0441\u043E\u0432\u043F\u0430\u0434\u0430\u044E\u0442",
  path: ["confirmPassword"]
});
function validate(schema, data) {
  try {
    const validData = schema.parse(data);
    return {
      success: true,
      data: validData,
      errors: null
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = {};
      error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(issue.message);
      });
      return {
        success: false,
        data: null,
        errors
      };
    }
    return {
      success: false,
      data: null,
      errors: { _general: ["\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438"] }
    };
  }
}

export { loginSchema as l, registerSchema as r, updateProfileSchema as u, validate as v };
//# sourceMappingURL=validation.mjs.map
