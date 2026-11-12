import { z } from "zod";

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const optionalId = z
  .string()
  .nullish()
  .transform((v) => (v ? v : null));

export const bookingSchema = z.object({
  classroomId: z.string().min(1),
  courseId: z.string().min(1),
  instructorId: optionalId,
  groupId: optionalId,
  dateFrom: ymd,
  dateTo: ymd,
  weekdays: z.array(z.number().int().min(1).max(7)).min(1).max(7),
  note: z.string().max(500).nullish(),
});
