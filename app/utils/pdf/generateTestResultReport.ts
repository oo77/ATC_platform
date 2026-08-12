import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface TestResultReportData {
  session: {
    id: string;
    studentName: string | null;
    studentPinfl?: string | null;
    attemptNumber: number;
    status: string;
    startedAt: string | Date;
    completedAt: string | Date | null;
    timeSpentSeconds: number | null;
    totalPoints: number | null;
    maxPoints: number | null;
    scorePercent: number | null;
    passed: boolean | null;
    grade: number | null;
    violations?: any[];
  };
  template: {
    id: string | null;
    name: string | null;
    code: string | null;
    passingScore: number | null;
    timeLimitMinutes: number | null;
  };
  context: {
    groupName: string | null;
    eventDate: string | Date | null;
  };
  stats?: {
    totalQuestions: number;
    answeredQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    unanswered: number;
    totalPoints: number;
    earnedPoints: number;
  };
  answers: Array<{
    questionId: string;
    questionText: string;
    questionType: 'single' | 'multiple' | 'text' | 'order' | 'match' | string;
    questionOptions: any;
    questionMedia?: any;
    questionExplanation?: string | null;
    questionPoints: number;
    studentAnswer: any;
    isCorrect: boolean | number | string | null;
    pointsEarned: number;
    answeredAt?: string | Date;
    timeSpentSeconds?: number | null;
  }>;
}

// Кэш шрифтов
let _fontCache: { regular: string; bold: string } | null = null;

async function getMontserratFonts(): Promise<{ regular: string; bold: string }> {
  if (_fontCache) return _fontCache;
  const [{ MontserratRegular }, { MontserratBold }] = await Promise.all([
    import('~/assets/fonts/montserrat-regular'),
    import('~/assets/fonts/montserrat-bold'),
  ]);
  _fontCache = { regular: MontserratRegular, bold: MontserratBold };
  return _fontCache;
}

async function registerMontserrat(doc: jsPDF): Promise<void> {
  const { regular, bold } = await getMontserratFonts();
  doc.addFileToVFS('Montserrat-Regular.ttf', regular);
  doc.addFont('Montserrat-Regular.ttf', 'Montserrat', 'normal');
  doc.addFileToVFS('Montserrat-Bold.ttf', bold);
  doc.addFont('Montserrat-Bold.ttf', 'Montserrat', 'bold');
  doc.setFont('Montserrat', 'normal');
}

// Кэш логотипа компании
let _logoCache: string | null = null;

async function getLogoData(): Promise<string | null> {
  if (_logoCache) return _logoCache;
  try {
    const response = await fetch('/logo.png');
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    _logoCache = `data:image/png;base64,${window.btoa(binary)}`;
    return _logoCache;
  } catch (e) {
    console.warn('Не удалось загрузить /logo.png:', e);
    return null;
  }
}

function formatDate(dateStr?: string | Date | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return '0 сек';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} сек`;
  if (secs === 0) return `${mins} мин`;
  return `${mins} мин ${secs} сек`;
}

function getQuestionTypeName(type: string): string {
  const map: Record<string, string> = {
    single: 'Один ответ',
    multiple: 'Несколько ответов',
    text: 'Текстовый ответ',
    order: 'Установление порядка',
    match: 'Сопоставление пар',
  };
  return map[type] || type;
}

// Проверка, был ли дан ответ
function checkIsAnswered(ans: any): boolean {
  if (!ans || ans.studentAnswer === null || ans.studentAnswer === undefined) return false;
  const sa = ans.studentAnswer;
  if (typeof sa === 'object') {
    if (sa.selectedOption) return true;
    if (Array.isArray(sa.selectedOptions) && sa.selectedOptions.length > 0) return true;
    if (typeof sa.text === 'string' && sa.text.trim() !== '') return true;
    if (Array.isArray(sa.orderedOptions) && sa.orderedOptions.length > 0) return true;
    if (Array.isArray(sa.matches) && sa.matches.length > 0) return true;
  }
  return false;
}

// Проверка, верный ли ответ
function checkIsCorrect(ans: any): boolean {
  if (ans.isCorrect === true || ans.isCorrect === 1 || ans.isCorrect === '1') return true;
  if (typeof ans.pointsEarned === 'number' && typeof ans.questionPoints === 'number' && ans.pointsEarned > 0) {
    return ans.pointsEarned >= ans.questionPoints;
  }
  return false;
}

// Получение текстового представления ответа экзаменуемого и правильного ответа
function getAnswerDetails(ans: any): { studentText: string; correctText: string; hasStudentAnswer: boolean } {
  const qType = ans.questionType;
  const studentAns = ans.studentAnswer;
  const qOptions = ans.questionOptions || {};

  let studentText = '(нет ответа)';
  let correctText = '-';
  let hasStudentAnswer = false;

  if (qType === 'single') {
    const options = qOptions.options || [];
    const selectedOpt = options.find((o: any) => o.id === studentAns?.selectedOption);
    if (selectedOpt) {
      studentText = selectedOpt.text || '';
      hasStudentAnswer = true;
    }
    const correctOpt = options.find((o: any) => o.correct);
    if (correctOpt) {
      correctText = correctOpt.text || '';
    }
  } else if (qType === 'multiple') {
    const options = qOptions.options || [];
    const selectedIds = Array.isArray(studentAns?.selectedOptions) ? studentAns.selectedOptions : [];
    if (selectedIds.length > 0) {
      const selectedTexts = options.filter((o: any) => selectedIds.includes(o.id)).map((o: any) => o.text);
      studentText = selectedTexts.join('; ') || '(нет ответа)';
      hasStudentAnswer = true;
    }
    const correctTexts = options.filter((o: any) => o.correct).map((o: any) => o.text);
    correctText = correctTexts.join('; ') || '-';
  } else if (qType === 'text') {
    if (studentAns?.text && typeof studentAns.text === 'string' && studentAns.text.trim() !== '') {
      studentText = studentAns.text;
      hasStudentAnswer = true;
    }
    const correctAnswers = qOptions.correctAnswers || [];
    correctText = correctAnswers.join('  |  ') || '-';
  } else if (qType === 'order') {
    const rawOptions = qOptions.options || [];
    const orderedStudentIds = studentAns?.orderedOptions || [];
    const getOptionTextById = (id: string) => {
      const found = rawOptions.find((o: any) => o.id === id);
      return found ? found.text : id;
    };
    if (orderedStudentIds.length > 0) {
      studentText = orderedStudentIds.map((id: string, i: number) => `${i + 1}. ${getOptionTextById(id)}`).join('  ->  ');
      hasStudentAnswer = true;
    }
    const correctOrderOptions = [...rawOptions].sort((a: any, b: any) => a.correctOrder - b.correctOrder);
    correctText = correctOrderOptions.map((o: any, i: number) => `${i + 1}. ${o.text}`).join('  ->  ');
  } else if (qType === 'match') {
    const pairs = qOptions.pairs || [];
    const studentMatches = studentAns?.matches || [];
    if (studentMatches.length > 0) {
      studentText = studentMatches.map((m: any) => `${m.left} -> ${m.right}`).join('; ');
      hasStudentAnswer = true;
    }
    correctText = pairs.map((p: any) => `${p.left} -> ${p.right}`).join('; ');
  } else {
    if (studentAns) {
      studentText = typeof studentAns === 'string' ? studentAns : JSON.stringify(studentAns);
      hasStudentAnswer = true;
    }
  }

  return { studentText, correctText, hasStudentAnswer };
}

/**
 * Генерирует и скачивает красивый PDF-протокол результатов тестирования
 */
export async function generateTestResultReport(data: TestResultReportData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  try {
    await registerMontserrat(doc);
  } catch (e) {
    console.error('Ошибка загрузки шрифта Montserrat:', e);
    doc.setFont('helvetica');
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const bottomLimit = pageHeight - margin - 16;

  let y = margin;

  // Проверка необходимости перехода на новую страницу
  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > bottomLimit) {
      doc.addPage();
      y = margin + 14; // отступ под верхний колонтитул с QR-кодом на страницах 2+
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // ЗАГРУЗКА ЛОГОТИПА И ГЕНЕРАЦИЯ QR-КОДА ДЛЯ ВЕРИФИКАЦИИ
  // ──────────────────────────────────────────────────────────────────────────
  let logoData: string | null = null;
  let qrDataUrl = '';

  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://atc.uz';
    const verifyUrl = `${origin}/test-templates/${data.template.id || ''}?session=${data.session.id}`;

    const [loadedLogo, generatedQr] = await Promise.all([
      getLogoData(),
      QRCode.toDataURL(verifyUrl, {
        margin: 0,
        width: 220,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      }),
    ]);
    logoData = loadedLogo;
    qrDataUrl = generatedQr;
  } catch (e) {
    console.warn('Ошибка загрузки логотипа или QR-кода:', e);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ВЫЧИСЛЕНИЕ СТАТИСТИКИ (НАДЕЖНЫЙ ПОДСЧЕТ)
  // ──────────────────────────────────────────────────────────────────────────
  const answers = data.answers || [];
  const totalQuestions = answers.length || data.stats?.totalQuestions || 0;
  
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let calculatedEarnedPoints = 0;
  let calculatedTotalPoints = 0;

  answers.forEach((ans) => {
    calculatedTotalPoints += Number(ans.questionPoints) || 0;
    calculatedEarnedPoints += Number(ans.pointsEarned) || 0;

    const answered = checkIsAnswered(ans);
    const correct = answered && checkIsCorrect(ans);

    if (!answered) {
      unansweredCount++;
    } else if (correct) {
      correctCount++;
    } else {
      incorrectCount++;
    }
  });

  const totalPoints = calculatedTotalPoints || data.session.maxPoints || data.stats?.totalPoints || 0;
  const earnedPoints = calculatedEarnedPoints || data.session.totalPoints || data.stats?.earnedPoints || 0;
  const scorePercent = data.session.scorePercent != null
    ? Math.round(data.session.scorePercent)
    : (totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0);

  const passingScore = data.template.passingScore || 0;
  const isPassed = data.session.passed != null
    ? Boolean(data.session.passed)
    : scorePercent >= passingScore;

  // ──────────────────────────────────────────────────────────────────────────
  // 1. ШАПКА ДОКУМЕНТА (HEADER СТРАНИЦЫ 1) С QR-КОДОМ
  // ──────────────────────────────────────────────────────────────────────────
  const headerHeight = 22;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, headerHeight, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, headerHeight, 2, 2, 'S');

  // Акцентная цветная полоса слева
  doc.setFillColor(37, 99, 235);
  doc.rect(margin, y, 3, headerHeight, 'F');

  // Текст бренда и заголовка
  doc.setFont('Montserrat', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(37, 99, 235);
  doc.text('ATC PLATFORM | СИСТЕМА ТЕСТИРОВАНИЯ', margin + 6, y + 5.5);

  doc.setFont('Montserrat', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(15, 23, 42);
  doc.text('ЛИСТ РЕЗУЛЬТАТОВ ТЕСТИРОВАНИЯ', margin + 6, y + 12);

  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const testTitle = `Тест: ${data.template.name || 'Без названия'} (${data.template.code || '-'})`;
  const splitTestTitle = doc.splitTextToSize(testTitle, contentWidth - 36);
  doc.text(splitTestTitle[0] || testTitle, margin + 6, y + 17.5);

  // QR-код в правом верхнем углу шапки
  if (qrDataUrl) {
    const qrSize = 16;
    const qrX = pageWidth - margin - qrSize - 2.5;
    const qrY = y + 1.8;
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    doc.setFont('Montserrat', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(148, 163, 184);
    doc.text('ПРОВЕРКА', qrX + qrSize / 2, qrY + qrSize + 2, { align: 'center' });
  }

  y += headerHeight + 4;

  // ──────────────────────────────────────────────────────────────────────────
  // 2. КАРТОЧКА МЕТАДАННЫХ (STUDENT & TEST INFO)
  // ──────────────────────────────────────────────────────────────────────────
  const infoBoxHeight = 19;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, infoBoxHeight, 2, 2, 'FD');

  const col1X = margin + 5;
  const col2X = margin + contentWidth / 2 + 3;
  const valCol1Offset = 36;
  const valCol2Offset = 38;

  // Левая колонка
  doc.setFontSize(7.5);
  let rowY = y + 6;

  doc.setFont('Montserrat', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Экзаменуемый:', col1X, rowY);
  doc.setFont('Montserrat', 'bold');
  doc.setTextColor(15, 23, 42);
  const studentName = data.session.studentName || 'Не указан';
  const splitName = doc.splitTextToSize(studentName, contentWidth / 2 - valCol1Offset - 2);
  doc.text(splitName[0] || studentName, col1X + valCol1Offset, rowY);

  rowY += 6.5;
  doc.setFont('Montserrat', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Учебная группа:', col1X, rowY);
  doc.setFont('Montserrat', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(data.context.groupName || '-', col1X + valCol1Offset, rowY);

  // Правая колонка
  rowY = y + 6;
  doc.setFont('Montserrat', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Дата сдачи:', col2X, rowY);
  doc.setFont('Montserrat', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(formatDate(data.session.completedAt || data.session.startedAt), col2X + valCol2Offset, rowY);

  rowY += 6.5;
  doc.setFont('Montserrat', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Попытка / Время:', col2X, rowY);
  doc.setFont('Montserrat', 'normal');
  doc.setTextColor(15, 23, 42);
  const timeSpent = formatDuration(data.session.timeSpentSeconds);
  const limitInfo = data.template.timeLimitMinutes ? ` (лимит: ${data.template.timeLimitMinutes} мин.)` : '';
  doc.text(`№ ${data.session.attemptNumber || 1}   |   ${timeSpent}${limitInfo}`, col2X + valCol2Offset, rowY);

  y += infoBoxHeight + 4;

  // ──────────────────────────────────────────────────────────────────────────
  // 3. БЛОК РЕЗУЛЬТАТА И СТАТИСТИКИ (SCORE BANNER)
  // ──────────────────────────────────────────────────────────────────────────
  const scoreBoxHeight = 24;

  if (isPassed) {
    doc.setFillColor(240, 253, 244); // green-50
    doc.setDrawColor(187, 247, 208); // green-200
  } else {
    doc.setFillColor(254, 242, 242); // red-50
    doc.setDrawColor(254, 202, 202); // red-200
  }
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, scoreBoxHeight, 2, 2, 'FD');

  // Акцентная полоса слева
  if (isPassed) {
    doc.setFillColor(34, 197, 94);
  } else {
    doc.setFillColor(239, 68, 68);
  }
  doc.rect(margin, y, 3, scoreBoxHeight, 'F');

  // Большой балл %
  doc.setFont('Montserrat', 'bold');
  doc.setFontSize(22);
  if (isPassed) {
    doc.setTextColor(22, 101, 52); // green-800
  } else {
    doc.setTextColor(153, 27, 27); // red-800
  }
  doc.text(`${scorePercent}%`, margin + 8, y + 15.5);

  // Статус и баллы
  const scoreX = margin + 36;
  doc.setFontSize(9.5);
  doc.setFont('Montserrat', 'bold');
  if (isPassed) {
    doc.setTextColor(22, 101, 52);
    doc.text('ТЕСТ СДАН', scoreX, y + 7.5);
  } else {
    doc.setTextColor(153, 27, 27);
    doc.text('ТЕСТ НЕ СДАН', scoreX, y + 7.5);
  }

  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Набрано баллов: ${earnedPoints} из ${totalPoints}`, scoreX, y + 13);
  doc.text(`Проходной балл: ${passingScore}%`, scoreX, y + 18.5);

  // Мини-статистика справа (3 плашки: подпись сверху, крупная цифра снизу)
  const statBoxW = 27;
  const statBoxH = 15.5;
  const statGap = 2.5;
  const statsStartX = pageWidth - margin - (statBoxW * 3 + statGap * 2) - 3;
  const statY = y + 4.2;

  // 1. Правильных ответов
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(statsStartX, statY, statBoxW, statBoxH, 1.5, 1.5, 'FD');
  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(5.2);
  doc.setTextColor(71, 85, 105);
  doc.text('правильных ответов', statsStartX + statBoxW / 2, statY + 4.5, { align: 'center' });
  doc.setFont('Montserrat', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(22, 101, 52);
  doc.text(`${correctCount}`, statsStartX + statBoxW / 2, statY + 11.5, { align: 'center' });

  // 2. Неправильных ответов
  const stat2X = statsStartX + statBoxW + statGap;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(stat2X, statY, statBoxW, statBoxH, 1.5, 1.5, 'FD');
  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(5.2);
  doc.setTextColor(71, 85, 105);
  doc.text('неправильных ответов', stat2X + statBoxW / 2, statY + 4.5, { align: 'center' });
  doc.setFont('Montserrat', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(153, 27, 27);
  doc.text(`${incorrectCount}`, stat2X + statBoxW / 2, statY + 11.5, { align: 'center' });

  // 3. Без ответов
  const stat3X = stat2X + statBoxW + statGap;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(stat3X, statY, statBoxW, statBoxH, 1.5, 1.5, 'FD');
  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(5.2);
  doc.setTextColor(100, 116, 139);
  doc.text('без ответов', stat3X + statBoxW / 2, statY + 4.5, { align: 'center' });
  doc.setFont('Montserrat', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${unansweredCount}`, stat3X + statBoxW / 2, statY + 11.5, { align: 'center' });

  y += scoreBoxHeight + 6;

  // ──────────────────────────────────────────────────────────────────────────
  // 4. РАЗДЕЛИТЕЛЬ И ЗАГОЛОВОК СПИСКА ВОПРОСОВ
  // ──────────────────────────────────────────────────────────────────────────
  doc.setFont('Montserrat', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('ДЕТАЛИЗАЦИЯ РЕЗУЛЬТАТОВ ТЕСТИРОВАНИЯ ПО ВОПРОСАМ', margin, y);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);

  y += 5;

  // ──────────────────────────────────────────────────────────────────────────
  // 5. СПИСОК ВОПРОСОВ (КОМПАКТНЫЙ ОТСТУП, БЕЗ СКОБОК)
  // ──────────────────────────────────────────────────────────────────────────
  for (let idx = 0; idx < answers.length; idx++) {
    const ans = answers[idx]!;
    const isAnswered = checkIsAnswered(ans);
    const isCorrect = isAnswered && checkIsCorrect(ans);
    const isIncorrect = isAnswered && !isCorrect;
    const qType = ans.questionType;

    const { studentText, correctText } = getAnswerDetails(ans);

    // Расчет высоты текста вопроса
    doc.setFont('Montserrat', 'normal');
    doc.setFontSize(8);
    const qTextLines = doc.splitTextToSize(ans.questionText || '', contentWidth - 10);
    const qTextHeight = qTextLines.length * 3.7;

    // Расчет высоты блоков ответов
    let answerBox1Height = 0;
    let answerBox2Height = 0;
    let answerBox1Lines: string[] = [];
    let answerBox2Lines: string[] = [];

    const textWidthInsideBox = contentWidth - 14;

    if (isCorrect) {
      answerBox1Lines = doc.splitTextToSize(`Правильно ответил: ${studentText}`, textWidthInsideBox);
      answerBox1Height = Math.max(6, answerBox1Lines.length * 3.6 + 2.8);
    } else if (isIncorrect) {
      answerBox1Lines = doc.splitTextToSize(`Ответил неправильно: ${studentText}`, textWidthInsideBox);
      answerBox1Height = Math.max(6, answerBox1Lines.length * 3.6 + 2.8);

      answerBox2Lines = doc.splitTextToSize(`Правильный ответ: ${correctText}`, textWidthInsideBox);
      answerBox2Height = Math.max(6, answerBox2Lines.length * 3.6 + 2.8);
    } else {
      // Не отвечено
      answerBox1Lines = doc.splitTextToSize('Без ответа: (нет ответа)', textWidthInsideBox);
      answerBox1Height = Math.max(6, answerBox1Lines.length * 3.6 + 2.8);

      answerBox2Lines = doc.splitTextToSize(`Правильный ответ: ${correctText}`, textWidthInsideBox);
      answerBox2Height = Math.max(6, answerBox2Lines.length * 3.6 + 2.8);
    }

    const answersTotalHeight = isCorrect
      ? answerBox1Height + 1
      : answerBox1Height + answerBox2Height + 2.5;

    // Расчет высоты пояснения
    let explanationHeight = 0;
    let expLines: string[] = [];
    if (ans.questionExplanation) {
      expLines = doc.splitTextToSize(ans.questionExplanation, contentWidth - 32);
      explanationHeight = expLines.length * 3.5 + 5;
    }

    // Компактная высота карточки вопроса с уменьшенным отступом
    const totalQuestionBoxHeight = 7.5 + qTextHeight + answersTotalHeight + explanationHeight + 2.5;

    // Проверяем помещается ли блок вопроса на текущую страницу
    ensureSpace(Math.min(totalQuestionBoxHeight, 80));

    const boxTop = y;

    // Рамка вопроса
    if (isCorrect) {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(187, 247, 208); // green-200
    } else if (isIncorrect) {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(254, 202, 202); // red-200
    } else {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240); // slate-200
    }
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, boxTop, contentWidth, totalQuestionBoxHeight, 2, 2, 'FD');

    // Шапка вопроса внутри карточки
    if (isCorrect) {
      doc.setFillColor(240, 253, 244);
    } else if (isIncorrect) {
      doc.setFillColor(254, 242, 242);
    } else {
      doc.setFillColor(248, 250, 252);
    }
    doc.rect(margin + 0.3, boxTop + 0.3, contentWidth - 0.6, 6.5, 'F');

    // Номер и тип вопроса (без квадратных скобок)
    doc.setFont('Montserrat', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Вопрос №${idx + 1}`, margin + 3.5, boxTop + 4.5);

    doc.setFont('Montserrat', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`•  ${getQuestionTypeName(qType)}`, margin + 26, boxTop + 4.5);

    // Баллы (выровнены по правому краю в шапке)
    doc.setFont('Montserrat', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Баллы: ${ans.pointsEarned}/${ans.questionPoints}`, pageWidth - margin - 4, boxTop + 4.5, { align: 'right' });

    // Текст вопроса (компактный отступ сверху)
    let curY = boxTop + 10;
    doc.setFont('Montserrat', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(qTextLines, margin + 4, curY);

    // Уменьшенный отступ между текстом вопроса и блоком ответа
    curY += qTextHeight + 1.2;

    // ────────────────────────────────────────────────────────────────────────
    // ОТРИСОВКА ОТВЕТОВ
    // ────────────────────────────────────────────────────────────────────────
    if (isCorrect) {
      // 1 СТРОКА: Правильно ответил: ...
      doc.setFillColor(240, 253, 244); // green-50
      doc.setDrawColor(187, 247, 208); // green-200
      doc.roundedRect(margin + 4, curY, contentWidth - 8, answerBox1Height, 1.2, 1.2, 'FD');

      doc.setFont('Montserrat', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(22, 101, 52);
      doc.text(answerBox1Lines, margin + 7, curY + 3.9);

      curY += answerBox1Height + 1.5;
    } else if (isIncorrect) {
      // 2 СТРОКИ:
      // Строка 1: Ответил неправильно: ...
      doc.setFillColor(254, 242, 242); // red-50
      doc.setDrawColor(254, 202, 202); // red-200
      doc.roundedRect(margin + 4, curY, contentWidth - 8, answerBox1Height, 1.2, 1.2, 'FD');

      doc.setFont('Montserrat', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(153, 27, 27);
      doc.text(answerBox1Lines, margin + 7, curY + 3.9);

      curY += answerBox1Height + 1.5;

      // Строка 2: Правильный ответ: ...
      doc.setFillColor(240, 253, 244); // green-50
      doc.setDrawColor(187, 247, 208); // green-200
      doc.roundedRect(margin + 4, curY, contentWidth - 8, answerBox2Height, 1.2, 1.2, 'FD');

      doc.setFont('Montserrat', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(22, 101, 52);
      doc.text(answerBox2Lines, margin + 7, curY + 3.9);

      curY += answerBox2Height + 1.5;
    } else {
      // 2 СТРОКИ ДЛЯ НЕ ОТВЕЧЕННОГО:
      // Строка 1: Без ответа: (нет ответа)
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.roundedRect(margin + 4, curY, contentWidth - 8, answerBox1Height, 1.2, 1.2, 'FD');

      doc.setFont('Montserrat', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(answerBox1Lines, margin + 7, curY + 3.9);

      curY += answerBox1Height + 1.5;

      // Строка 2: Правильный ответ: ...
      doc.setFillColor(240, 253, 244); // green-50
      doc.setDrawColor(187, 247, 208); // green-200
      doc.roundedRect(margin + 4, curY, contentWidth - 8, answerBox2Height, 1.2, 1.2, 'FD');

      doc.setFont('Montserrat', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(22, 101, 52);
      doc.text(answerBox2Lines, margin + 7, curY + 3.9);

      curY += answerBox2Height + 1.5;
    }

    // Пояснение к вопросу (если есть)
    if (ans.questionExplanation && expLines.length > 0) {
      curY += 0.5;
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin + 4, curY - 2, contentWidth - 8, explanationHeight - 1, 1, 1, 'FD');

      doc.setFont('Montserrat', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(37, 99, 235);
      doc.text('Пояснение: ', margin + 6.5, curY + 1);

      doc.setFont('Montserrat', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text(expLines, margin + 24, curY + 1);

      curY += explanationHeight;
    }

    y += totalQuestionBoxHeight + 3;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6. ВОДЯНОЙ ЗНАК (ЕЛЕ ЗАМЕТНЫЙ ЛОГОТИП), ВЕРХНИЙ И НИЖНИЙ КОЛОНТИТУЛЫ
  // ──────────────────────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  const nowFormatted = formatDate(new Date());

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // 1. Водяной знак: еле заметный логотип компании по центру страницы
    if (logoData) {
      try {
        const logoW = 100;
        let logoH = 50;
        try {
          const imgProps = doc.getImageProperties(logoData);
          if (imgProps && imgProps.width && imgProps.height) {
            logoH = logoW * (imgProps.height / imgProps.width);
          }
        } catch {
          // fallback
        }
        const logoX = (pageWidth - logoW) / 2;
        const logoY = (pageHeight - logoH) / 2;

        const gState = new (doc as any).GState({ opacity: 0.05 });
        doc.setGState(gState);
        doc.addImage(logoData, 'PNG', logoX, logoY, logoW, logoH);
        doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
      } catch (err) {
        console.warn('Ошибка отрисовки водяного знака логотипа:', err);
      }
    }

    // 2. Верхний колонтитул с QR-кодом на страницах 2+
    if (i > 1 && qrDataUrl) {
      const miniQrSize = 11;
      const miniQrX = pageWidth - margin - miniQrSize;
      const miniQrY = margin - 3;
      doc.addImage(qrDataUrl, 'PNG', miniQrX, miniQrY, miniQrSize, miniQrSize);

      doc.setFont('Montserrat', 'bold');
      doc.setFontSize(4.5);
      doc.setTextColor(148, 163, 184);
      doc.text('ПРОВЕРКА', miniQrX + miniQrSize / 2, miniQrY + miniQrSize + 1.5, { align: 'center' });

      doc.setFont('Montserrat', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(37, 99, 235);
      doc.text('ATC PLATFORM', margin, margin + 2);

      doc.setFont('Montserrat', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`|  Лист результатов: ${data.session.studentName || 'Экзаменуемый'} (${data.template.code || 'Тест'})`, margin + 27, margin + 2);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, margin + 9.5, pageWidth - margin, margin + 9.5);
    }

    // 3. Разделитель футера
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

    // 4. Официальная надпись о конфиденциальности и запрете копирования
    doc.setFont('Montserrat', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(115, 125, 140);
    doc.text(
      'Документ хранится в "Airports Training Center" МЧЖ. Копирование, фотографирование и иное воспроизведение документа запрещены. Экзаменуемому на руки не выдается.',
      pageWidth / 2,
      pageHeight - 9.5,
      { align: 'center' }
    );

    // 5. Технический футер (бренд системы и нумерация страниц)
    doc.setFont('Montserrat', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(160, 174, 192);
    doc.text(`ATC Platform | Сформирован: ${nowFormatted}`, margin, pageHeight - 4.5);
    doc.text(`Страница ${i} из ${totalPages}`, pageWidth - margin, pageHeight - 4.5, { align: 'right' });
  }

  // Имя файла для сохранения
  const safeStudentName = (data.session.studentName || 'Экзаменуемый')
    .replace(/[\\/*?:"<>|]/g, '')
    .replace(/\s+/g, '_');
  const safeTestName = (data.template.code || data.template.name || 'Тест')
    .replace(/[\\/*?:"<>|]/g, '')
    .replace(/\s+/g, '_');
  const filename = `Лист_результатов_тестирования_${safeStudentName}_${safeTestName}.pdf`;

  doc.save(filename);
}
