import { describe, expect, it } from "vitest";
import {
  formatFoundedDateDisplay,
  formatFoundedDateLabel,
  parseFoundedDateInput,
} from "@/lib/company/founded-date";

describe("founded-date", () => {
  it("parses full date input", () => {
    expect(parseFoundedDateInput("2003-06-15")).toEqual({
      foundedDate: "2003-06-15",
      foundedYear: 2003,
    });
    expect(parseFoundedDateInput("2003.6.15")).toEqual({
      foundedDate: "2003-06-15",
      foundedYear: 2003,
    });
  });

  it("parses year-only legacy input", () => {
    expect(parseFoundedDateInput("2003")).toEqual({
      foundedDate: null,
      foundedYear: 2003,
    });
  });

  it("formats display values", () => {
    expect(formatFoundedDateDisplay("2003-06-15", 2003)).toBe("2003-06-15");
    expect(formatFoundedDateDisplay(null, 2003)).toBe("2003");
    expect(formatFoundedDateLabel(null, 2003)).toBe("2003년");
  });
});
