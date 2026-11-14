import { describe, it, expect } from "vitest";
import {
  buildFuzzyTextCondition,
  homoglyphVariants,
  tokenizeSearchText,
} from "../../../server/utils/fuzzyTextSearch";

describe("fuzzyTextSearch", () => {
  it("drops quotes and punctuation", () => {
    expect(tokenizeSearchText('ООО «SANEG JETWHITES»')).toEqual(["ООО", "SANEG", "JETWHITES"]);
    expect(tokenizeSearchText('ООО "SANEG JETWHITES"')).toEqual(["ООО", "SANEG", "JETWHITES"]);
    expect(tokenizeSearchText("  «» ")).toEqual([]);
  });

  it("maps Cyrillic/Latin look-alikes both ways", () => {
    expect(homoglyphVariants("OOO")).toContain("ООО");
    expect(homoglyphVariants("ООО")).toContain("OOO");
    expect(homoglyphVariants("SANEG")).toEqual(["SANEG", "SАNЕG"]); // A,E → кириллица
    expect(homoglyphVariants("JETWHITES")).toHaveLength(2);
  });

  it("builds an AND of per-word OR conditions with escaped LIKE params", () => {
    const c = buildFuzzyTextCondition(["a", "b"], "50%_x")!;
    expect(c.sql).toBe("((a LIKE ? OR b LIKE ? OR a LIKE ? OR b LIKE ?))");
    expect(c.params[0]).toBe(String.raw`%50\%\_x%`);
    expect(buildFuzzyTextCondition(["a"], " « ")).toBeNull();
  });
});
