import { describe, it, expect } from "vitest";
import {
  computeHourSpans,
  formatMinutes,
  isMixedPair,
  shortPersonName,
  type ExcelPeriod,
} from "../../../server/utils/scheduleExcel";
import { latinToCyrillic } from "../../../shared/utils/latinToCyrillic";

const GRID: ExcelPeriod[] = [
  ["9:00", "9:40"], ["9:40", "10:20"], ["10:30", "11:10"], ["11:10", "11:50"],
  ["12:00", "12:40"], ["12:40", "13:20"], ["14:00", "14:40"], ["14:40", "15:20"],
  ["15:30", "16:10"], ["16:10", "16:50"],
].map(([startTime, endTime], i) => ({ periodNumber: i + 1, startTime, endTime }));

const render = (mixed: number[], ending: number[] = []) =>
  [...computeHourSpans(GRID, new Set(mixed), new Set(ending))]
    .map(([n, s]) => `${n}:${formatMinutes(s.start)}-${formatMinutes(s.end)}`)
    .join(" ");

const ev = (id: string, discipline: string, eventType: string) =>
  ({ id, title: discipline, discipline: { id: discipline, name: discipline }, eventType }) as any;

describe("computeHourSpans", () => {
  it("обычные пары — по сетке 40 минут", () => {
    expect(render([])).toContain("7:14:00-14:40 8:14:40-15:20 9:15:30-16:10 10:16:10-16:50");
  });

  it("практика на 7 часу, экзамен на 8: 14:00-14:45 и 14:50-15:35, 5-я пара сдвигается", () => {
    expect(render([4])).toContain("7:14:00-14:45 8:14:50-15:35 9:15:45-16:25 10:16:25-17:05");
  });

  it("смешанная первая пара сдвигает все следующие", () => {
    expect(render([1])).toContain("1:9:00-9:45 2:9:50-10:35 3:10:45-11:25 4:11:25-12:05");
  });

  it("занятие кончается на нечётном часе — последний час 45 минут, следующие пары сдвигаются на 5 минут", () => {
    const r = render([], [4]);
    expect(r).toContain("5:12:00-12:40 6:12:40-13:20 7:14:00-14:45 8:14:45-15:25");
    expect(r).toContain("9:15:35-16:15");
  });

  it("занятие кончается на 3 часу: 10:30-11:15, 4 час 11:15-11:55, следующие пары +5 минут", () => {
    expect(render([], [2])).toContain("3:10:30-11:15 4:11:15-11:55 5:12:05-12:45 6:12:45-13:25 7:14:05-14:45 8:14:45-15:25");
  });
});

describe("isMixedPair", () => {
  it("практика → экзамен и смена дисциплины — особая пара", () => {
    expect(isMixedPair(ev("1", "A", "practice"), ev("2", "A", "assessment"))).toBe(true);
    expect(isMixedPair(ev("1", "A", "theory"), ev("2", "A", "assessment"))).toBe(true);
    expect(isMixedPair(ev("1", "A", "theory"), ev("2", "B", "theory"))).toBe(true);
  });

  it("то же занятие, теория → практика без экзамена — обычная пара", () => {
    expect(isMixedPair(ev("1", "A", "theory"), ev("1", "A", "theory"))).toBe(false);
    expect(isMixedPair(ev("1", "A", "theory"), ev("2", "A", "practice"))).toBe(false);
    expect(isMixedPair(undefined, ev("2", "A", "assessment"))).toBe(false);
  });
});

describe("имена инструкторов", () => {
  it("латиница → русский", () => {
    expect(latinToCyrillic("Yunusov Xurshid")).toBe("Юнусов Хуршид");
    expect(shortPersonName("Jalilov Otabek Ahmadovich")).toBe("Джалилов О.");
    expect(shortPersonName("O'rinov G'ayrat")).toBe("Уринов Г.");
  });

  it("кириллица не меняется", () => {
    expect(shortPersonName("Кашаев Рустам Олегович")).toBe("Кашаев Р.");
  });
});
