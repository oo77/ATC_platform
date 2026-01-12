/**
 * API endpoint для ручного создания standalone сертификата
 * POST /api/certificates/manual
 */

import { createStandaloneCertificate, getCertificateByNumber } from '../../repositories/certificateTemplateRepository';
import { getStudentById, getStudentByPinfl, createStudent } from '../../repositories/studentRepository';
import { defineEventHandler, readBody, createError } from 'h3';
import { logActivity } from '../../utils/activityLogger';

interface ManualCertificateInput {
    // Данные слушателя - либо ID существующего, либо данные для создания нового
    studentId?: string;
    createNewStudent?: boolean;
    studentData?: {
        fullName: string;
        pinfl: string;
        organization: string;
        position: string;
        department?: string;
    };

    // Данные сертификата
    certificateNumber: string;
    issueDate: string;
    expiryDate?: string | null;

    // Данные курса - либо ID существующего, либо ручной ввод
    courseId?: string;
    courseName: string;
    courseCode?: string;
    courseHours?: number;

    // Файл сертификата
    fileUrl?: string;
    fileUuid?: string;
}

interface ValidationError {
    field: string;
    message: string;
}

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<ManualCertificateInput>(event);

        // Валидация входных данных
        const errors: ValidationError[] = [];

        // Проверка слушателя
        if (!body.studentId && !body.createNewStudent) {
            errors.push({ field: 'studentId', message: 'Необходимо выбрать слушателя или создать нового' });
        }

        if (body.createNewStudent && body.studentData) {
            if (!body.studentData.fullName?.trim()) {
                errors.push({ field: 'studentData.fullName', message: 'ФИО слушателя обязательно' });
            }
            if (!body.studentData.pinfl?.trim()) {
                errors.push({ field: 'studentData.pinfl', message: 'ПИНФЛ обязателен' });
            } else if (!/^\d{14}$/.test(body.studentData.pinfl.trim())) {
                errors.push({ field: 'studentData.pinfl', message: 'ПИНФЛ должен содержать 14 цифр' });
            }
            if (!body.studentData.organization?.trim()) {
                errors.push({ field: 'studentData.organization', message: 'Организация обязательна' });
            }
            if (!body.studentData.position?.trim()) {
                errors.push({ field: 'studentData.position', message: 'Должность обязательна' });
            }
        }

        // Проверка данных сертификата
        if (!body.certificateNumber?.trim()) {
            errors.push({ field: 'certificateNumber', message: 'Номер сертификата обязателен' });
        }

        if (!body.issueDate) {
            errors.push({ field: 'issueDate', message: 'Дата выдачи обязательна' });
        }

        // Проверка данных курса
        if (!body.courseName?.trim()) {
            errors.push({ field: 'courseName', message: 'Название курса обязательно' });
        }

        // Проверка сроков
        if (body.expiryDate && body.issueDate) {
            const issueDate = new Date(body.issueDate);
            const expiryDate = new Date(body.expiryDate);
            if (expiryDate <= issueDate) {
                errors.push({ field: 'expiryDate', message: 'Дата окончания должна быть позже даты выдачи' });
            }
        }

        if (errors.length > 0) {
            throw createError({
                statusCode: 400,
                message: 'Ошибки валидации',
                data: { errors }
            });
        }

        // Проверка уникальности номера сертификата
        const existingCert = await getCertificateByNumber(body.certificateNumber.trim());
        if (existingCert) {
            throw createError({
                statusCode: 409,
                message: `Сертификат с номером ${body.certificateNumber} уже существует`
            });
        }

        // Определение слушателя
        let studentId = body.studentId;

        if (body.createNewStudent && body.studentData) {
            // Проверка, нет ли уже слушателя с таким ПИНФЛ
            const existingStudent = await getStudentByPinfl(body.studentData.pinfl.trim());
            if (existingStudent) {
                throw createError({
                    statusCode: 409,
                    message: `Слушатель с ПИНФЛ ${body.studentData.pinfl} уже существует`
                });
            }

            // Создание нового слушателя
            const newStudent = await createStudent({
                fullName: body.studentData.fullName.trim(),
                pinfl: body.studentData.pinfl.trim(),
                organization: body.studentData.organization.trim(),
                position: body.studentData.position.trim(),
                department: body.studentData.department?.trim() || undefined,
            });

            studentId = newStudent.id;
        } else if (studentId) {
            // Проверка существования слушателя
            const student = await getStudentById(studentId);
            if (!student) {
                throw createError({
                    statusCode: 404,
                    message: 'Слушатель не найден'
                });
            }
        }

        if (!studentId) {
            throw createError({
                statusCode: 400,
                message: 'Не удалось определить слушателя'
            });
        }

        // Формирование URL файла (если указан fileUuid, нужно получить URL)
        let pdfFileUrl = body.fileUrl?.trim() || undefined;

        // TODO: Если передан fileUuid, получить URL из файлового менеджера
        if (body.fileUuid && !pdfFileUrl) {
            // Здесь можно добавить логику получения URL файла по UUID
            // пока оставляем undefined
        }

        // Создание standalone сертификата
        const certificate = await createStandaloneCertificate({
            studentId,
            certificateNumber: body.certificateNumber.trim(),
            issueDate: new Date(body.issueDate),
            expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
            courseName: body.courseName.trim(),
            courseCode: body.courseCode?.trim(),
            courseHours: body.courseHours,
            sourceType: 'manual',
            pdfFileUrl,
        });

        // Логируем действие
        await logActivity(
            event,
            'CREATE',
            'ISSUED_CERTIFICATE',
            certificate.id,
            `${certificate.certificateNumber} — ${body.courseName}`,
            {
                studentId,
                certificateNumber: certificate.certificateNumber,
                courseName: certificate.courseName,
                sourceType: 'manual',
                createdNewStudent: body.createNewStudent,
            }
        );

        return {
            success: true,
            message: 'Сертификат успешно создан',
            certificate: {
                id: certificate.id,
                certificateNumber: certificate.certificateNumber,
                issueDate: certificate.issueDate,
                expiryDate: certificate.expiryDate,
                courseName: certificate.courseName,
                courseCode: certificate.courseCode,
                sourceType: certificate.sourceType,
            }
        };

    } catch (error: any) {
        console.error('Ошибка создания сертификата:', error);

        if (error.statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            message: 'Внутренняя ошибка сервера при создании сертификата'
        });
    }
});
