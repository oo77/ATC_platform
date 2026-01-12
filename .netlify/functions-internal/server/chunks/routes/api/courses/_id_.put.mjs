import { d as defineEventHandler, a as getRouterParam, r as readBody } from '../../../nitro/nitro.mjs';
import { c as courseCodeExists, u as updateCourse, g as getCourseById, a as deleteDiscipline, b as updateDiscipline, e as addDisciplineToCourse } from '../../../_/courseRepository.mjs';
import { l as logActivity } from '../../../_/activityLogger.mjs';
import { z } from 'zod';
import 'grammy';
import 'uuid';
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
import '../../../_/activityLogRepository.mjs';

const disciplineSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  theoryHours: z.number().min(0).default(0),
  practiceHours: z.number().min(0).default(0),
  assessmentHours: z.number().min(0).default(0),
  orderIndex: z.number().optional(),
  instructorIds: z.array(z.string()).optional()
});
const updateCourseSchema = z.object({
  name: z.string().min(1).optional(),
  shortName: z.string().min(2).max(10).optional(),
  code: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  certificateTemplateId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  disciplines: z.array(disciplineSchema).optional()
});
const _id__put = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return {
        success: false,
        message: "ID \u043A\u0443\u0440\u0441\u0430 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      };
    }
    const body = await readBody(event);
    const validationResult = updateCourseSchema.safeParse(body);
    if (!validationResult.success) {
      return {
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u0434\u0430\u043D\u043D\u044B\u0445",
        errors: validationResult.error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message
        }))
      };
    }
    const data = validationResult.data;
    if (data.code) {
      const codeExists = await courseCodeExists(data.code, id);
      if (codeExists) {
        return {
          success: false,
          message: "\u041A\u0443\u0440\u0441 \u0441 \u0442\u0430\u043A\u0438\u043C \u043A\u043E\u0434\u043E\u043C \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442",
          field: "code"
        };
      }
    }
    const { disciplines, ...courseData } = data;
    const course = await updateCourse(id, courseData);
    if (!course) {
      return {
        success: false,
        message: "\u041A\u0443\u0440\u0441 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      };
    }
    if (disciplines !== void 0) {
      const currentCourse = await getCourseById(id, true);
      const currentDisciplineIds = new Set(currentCourse?.disciplines?.map((d) => d.id) || []);
      const newDisciplineIds = new Set(disciplines.filter((d) => d.id).map((d) => d.id));
      for (const disciplineId of currentDisciplineIds) {
        if (!newDisciplineIds.has(disciplineId)) {
          await deleteDiscipline(disciplineId);
        }
      }
      for (let i = 0; i < disciplines.length; i++) {
        const discipline = disciplines[i];
        if (discipline.id && currentDisciplineIds.has(discipline.id)) {
          await updateDiscipline(discipline.id, {
            name: discipline.name,
            description: discipline.description,
            theoryHours: discipline.theoryHours,
            practiceHours: discipline.practiceHours,
            assessmentHours: discipline.assessmentHours,
            orderIndex: i,
            instructorIds: discipline.instructorIds
          });
        } else {
          await addDisciplineToCourse(id, {
            name: discipline.name,
            description: discipline.description || void 0,
            theoryHours: discipline.theoryHours,
            practiceHours: discipline.practiceHours,
            assessmentHours: discipline.assessmentHours,
            orderIndex: i,
            instructorIds: discipline.instructorIds
          });
        }
      }
    }
    const updatedCourse = await getCourseById(id, true);
    await logActivity(
      event,
      "UPDATE",
      "COURSE",
      id,
      updatedCourse?.name,
      { updatedFields: Object.keys(courseData) }
    );
    return {
      success: true,
      message: "\u041A\u0443\u0440\u0441 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0431\u043D\u043E\u0432\u043B\u0451\u043D",
      course: updatedCourse
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u043A\u0443\u0440\u0441\u0430:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u043A\u0443\u0440\u0441\u0430"
    };
  }
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
