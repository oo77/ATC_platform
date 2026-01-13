import { d as defineEventHandler } from '../../../../nitro/nitro.mjs';
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

const sources_get = defineEventHandler(async () => {
  const sources = [
    // Данные студента
    { value: "student.fullName", label: "\u0424\u0418\u041E \u043F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E", group: "\u0421\u0442\u0443\u0434\u0435\u043D\u0442" },
    { value: "student.shortName", label: "\u0424\u0418\u041E \u0441\u043E\u043A\u0440\u0430\u0449\u0451\u043D\u043D\u043E (\u0418\u0432\u0430\u043D\u043E\u0432 \u0418.\u0418.)", group: "\u0421\u0442\u0443\u0434\u0435\u043D\u0442" },
    { value: "student.lastName", label: "\u0424\u0430\u043C\u0438\u043B\u0438\u044F", group: "\u0421\u0442\u0443\u0434\u0435\u043D\u0442" },
    { value: "student.firstName", label: "\u0418\u043C\u044F", group: "\u0421\u0442\u0443\u0434\u0435\u043D\u0442" },
    { value: "student.middleName", label: "\u041E\u0442\u0447\u0435\u0441\u0442\u0432\u043E", group: "\u0421\u0442\u0443\u0434\u0435\u043D\u0442" },
    { value: "student.organization", label: "\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F", group: "\u0421\u0442\u0443\u0434\u0435\u043D\u0442" },
    { value: "student.position", label: "\u0414\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C", group: "\u0421\u0442\u0443\u0434\u0435\u043D\u0442" },
    { value: "student.department", label: "\u041E\u0442\u0434\u0435\u043B", group: "\u0421\u0442\u0443\u0434\u0435\u043D\u0442" },
    { value: "student.pinfl", label: "\u041F\u0418\u041D\u0424\u041B", group: "\u0421\u0442\u0443\u0434\u0435\u043D\u0442" },
    // Данные курса
    { value: "course.name", label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u0443\u0440\u0441\u0430", group: "\u041A\u0443\u0440\u0441" },
    { value: "course.shortName", label: "\u041A\u0440\u0430\u0442\u043A\u043E\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", group: "\u041A\u0443\u0440\u0441" },
    { value: "course.code", label: "\u041A\u043E\u0434 \u043A\u0443\u0440\u0441\u0430", group: "\u041A\u0443\u0440\u0441" },
    { value: "course.totalHours", label: "\u0412\u0441\u0435\u0433\u043E \u0447\u0430\u0441\u043E\u0432", group: "\u041A\u0443\u0440\u0441" },
    { value: "course.description", label: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u043A\u0443\u0440\u0441\u0430", group: "\u041A\u0443\u0440\u0441" },
    // Данные группы
    { value: "group.code", label: "\u041A\u043E\u0434 \u0433\u0440\u0443\u043F\u043F\u044B", group: "\u0413\u0440\u0443\u043F\u043F\u0430" },
    { value: "group.startDate", label: "\u0414\u0430\u0442\u0430 \u043D\u0430\u0447\u0430\u043B\u0430", group: "\u0413\u0440\u0443\u043F\u043F\u0430" },
    { value: "group.endDate", label: "\u0414\u0430\u0442\u0430 \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F", group: "\u0413\u0440\u0443\u043F\u043F\u0430" },
    { value: "group.classroom", label: "\u0410\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u044F", group: "\u0413\u0440\u0443\u043F\u043F\u0430" },
    // Данные сертификата
    { value: "certificate.number", label: "\u041D\u043E\u043C\u0435\u0440 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430", group: "\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442" },
    { value: "certificate.issueDate", label: "\u0414\u0430\u0442\u0430 \u0432\u044B\u0434\u0430\u0447\u0438 (\u0414\u0414.\u041C\u041C.\u0413\u0413\u0413\u0413)", group: "\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442" },
    { value: "certificate.issueDateFormatted", label: "\u0414\u0430\u0442\u0430 \u0432\u044B\u0434\u0430\u0447\u0438 \u043F\u0440\u043E\u043F\u0438\u0441\u044C\u044E", group: "\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442" }
  ];
  const grouped = sources.reduce((acc, source) => {
    if (!acc[source.group]) {
      acc[source.group] = [];
    }
    acc[source.group].push({
      value: source.value,
      label: source.label
    });
    return acc;
  }, {});
  return {
    success: true,
    sources,
    grouped
  };
});

export { sources_get as default };
//# sourceMappingURL=sources.get.mjs.map
