import type { ProcessedCertificateResponse } from '../../../types';
import { CertificateAIProcessor } from '../../utils/certificateAI';
import { OpenAIEmployeeMatcher } from '../../utils/openaiMatcher';

export default defineEventHandler(async (event): Promise<ProcessedCertificateResponse> => {
  try {
    console.log('📤 Начало обработки загрузки сертификата');
    
    // Получить загруженный файл
    const formData = await readMultipartFormData(event);
    console.log('📋 FormData получена:', formData?.length || 0, 'элементов');
    
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Файл не загружен',
      });
    }

    const fileData = formData.find(item => item.name === 'file');
    const employeeIdData = formData.find(item => item.name === 'employeeId');

    if (!fileData || !fileData.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Файл не найден',
      });
    }

    console.log('📁 Файл найден:', fileData.filename, 'Тип:', fileData.type, 'Размер:', fileData.data.length, 'байт');

    // Создать File объект из загруженных данных
    const file = new File([new Uint8Array(fileData.data)], fileData.filename || 'certificate', {
      type: fileData.type || 'image/png',
    });

    console.log('🤖 Запуск AI обработки...');
    
    // Обработать сертификат с помощью AI
    const extractedData = await CertificateAIProcessor.processCertificate(file);
    
    console.log('✅ AI обработка завершена. Извлечённые данные:', {
      fullName: extractedData.fullName,
      certificateNumber: extractedData.certificateNumber,
      confidence: extractedData.confidence
    });

    // Валидация извлечённых данных
    const validation = CertificateAIProcessor.validateExtractedData(extractedData);
    console.log('🔍 Валидация:', validation.valid ? 'Успешно' : 'С ошибками', validation.errors);


    // Попытка получить список сотрудников (может не работать если БД не настроена)
    let employees: any[] = [];
    let suggestedEmployee = undefined;
    let matchMethod = 'none';
    let matchConfidence = 0;
    let aiReasoning = undefined;
    
    try {
      console.log('👥 Получение списка сотрудников...');
      employees = await $fetch('/api/employees');
      console.log('✅ Получено сотрудников:', employees.length);
      
      // Шаг 1: Попробовать обычный поиск (быстро, бесплатно)
      console.log('🔍 Шаг 1: Обычный поиск...');
      suggestedEmployee = CertificateAIProcessor.findMatchingEmployee(
        extractedData,
        employees
      );
      
      if (suggestedEmployee) {
        matchMethod = 'exact';
        matchConfidence = 1.0;
        console.log('✅ Найден точным совпадением:', suggestedEmployee.firstName, suggestedEmployee.lastName);
      } else {
        // Шаг 2: Если не нашли - использовать OpenAI
        console.log('⚠️ Обычный поиск не дал результатов');
        console.log('🤖 Шаг 2: Запуск OpenAI...');
        
        try {
          const aiResult = await OpenAIEmployeeMatcher.findMatchingEmployee(
            extractedData,
            employees
          );
          
          if (aiResult.employee && aiResult.confidence > 0.7) {
            suggestedEmployee = aiResult.employee;
            matchMethod = 'ai';
            matchConfidence = aiResult.confidence;
            aiReasoning = aiResult.reasoning;
            console.log('✅ AI нашел сотрудника:', suggestedEmployee.firstName, suggestedEmployee.lastName);
            console.log('🎯 Уверенность AI:', Math.round(aiResult.confidence * 100) + '%');
            console.log('💭 Объяснение AI:', aiResult.reasoning);
          } else {
            console.log('⚠️ AI не нашел подходящего сотрудника (уверенность слишком низкая)');
          }
        } catch (aiError: any) {
          console.warn('⚠️ Ошибка при использовании OpenAI:', aiError.message);
          // Продолжаем без AI
        }
      }
    } catch (dbError: any) {
      console.warn('⚠️ Не удалось получить список сотрудников (БД может быть не настроена):', dbError.message);
      // Продолжаем работу без поиска сотрудника
    }


    // Сохранить файл (в реальной версии - на диск или в облако)
    const fileUrl = `/uploads/${Date.now()}_${fileData.filename}`;

    const response = {
      success: validation.valid,
      extractedData,
      suggestedEmployee,
      matchInfo: {
        method: matchMethod, // 'none', 'exact', 'ai'
        confidence: matchConfidence,
        aiReasoning: aiReasoning,
      },
      message: validation.valid 
        ? 'Сертификат успешно обработан' 
        : `Обработка завершена с предупреждениями: ${validation.errors.join(', ')}`,
    };

    console.log('🎉 Обработка завершена успешно');
    return response;

  } catch (error: any) {
    console.error('❌ Ошибка при обработке сертификата:', error);
    console.error('Stack trace:', error.stack);
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Ошибка при обработке сертификата',
    });
  }
});
