import { pdfToPng } from 'pdf-to-png-converter';

/**
 * Утилита для работы с PDF файлами
 * Конвертирует PDF в изображение для анализа GPT-4 Vision
 */
export class PDFConverter {
  /**
   * Конвертировать PDF в base64 изображение
   */
  static async convertPDFToImage(pdfBuffer: Buffer): Promise<{ base64: string; mimeType: string }> {
    try {
      console.log('📄 Начинаем конвертацию PDF в изображение...');
      console.log('📏 Размер PDF:', pdfBuffer.length, 'байт');

      // Конвертируем PDF в PNG
      const pngPages = await pdfToPng(pdfBuffer as any, {
        pagesToProcess: [1], // Только первая страница
        strictPagesToProcess: false,
        verbosityLevel: 0,
      } as any);

      if (!pngPages || pngPages.length === 0) {
        throw new Error('Не удалось конвертировать PDF в изображение');
      }

      const firstPage = pngPages[0];
      if (!firstPage || !firstPage.content) {
        throw new Error('Не удалось получить содержимое страницы');
      }

      console.log(`📖 PDF конвертирован. Страница: 1`);
      console.log(`📏 Размер изображения: ${firstPage.content.length} байт`);

      // Конвертируем в base64
      const base64 = firstPage.content.toString('base64');
      console.log('✅ PDF успешно конвертирован в base64');
      console.log('📏 Размер base64:', base64.length, 'символов');

      return {
        base64: base64,
        mimeType: 'image/png',
      };
    } catch (error: any) {
      console.error('❌ Ошибка при конвертации PDF:', error.message);
      throw new Error('Не удалось конвертировать PDF в изображение');
    }
  }

  /**
   * Проверить, является ли файл PDF
   */
  static isPDF(mimeType: string): boolean {
    return mimeType === 'application/pdf' || mimeType.includes('pdf');
  }
}
