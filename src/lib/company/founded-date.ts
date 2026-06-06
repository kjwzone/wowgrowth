export type FoundedDateValue = {
  foundedDate: string | null;
  foundedYear: number | null;
};

const pad2 = (value: number): string => String(value).padStart(2, "0");

const isValidDateParts = (year: number, month: number, day: number): boolean => {
  if (year < 1800 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

export const toIsoDateString = (
  year: number,
  month: number,
  day: number,
): string => `${year}-${pad2(month)}-${pad2(day)}`;

export const parseFoundedDateInput = (raw: string): FoundedDateValue => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { foundedDate: null, foundedYear: null };
  }

  const yearOnly = trimmed.match(/^(\d{4})$/);
  if (yearOnly) {
    const year = Number(yearOnly[1]);
    if (year >= 1800 && year <= 2100) {
      return { foundedDate: null, foundedYear: year };
    }
    return { foundedDate: null, foundedYear: null };
  }

  const matched = trimmed.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (!matched) {
    return { foundedDate: null, foundedYear: null };
  }

  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);

  if (!isValidDateParts(year, month, day)) {
    return { foundedDate: null, foundedYear: null };
  }

  const foundedDate = toIsoDateString(year, month, day);
  return { foundedDate, foundedYear: year };
};

export const formatFoundedDateDisplay = (
  foundedDate: string | null | undefined,
  foundedYear: number | null | undefined,
): string => {
  if (foundedDate) return foundedDate;
  if (foundedYear) return String(foundedYear);
  return "";
};

export const formatFoundedDateLabel = (
  foundedDate: string | null | undefined,
  foundedYear: number | null | undefined,
): string => {
  if (foundedDate) return foundedDate;
  if (foundedYear) return `${foundedYear}년`;
  return "-";
};

export const isCompleteFoundedDate = (raw: string): boolean => {
  const parsed = parseFoundedDateInput(raw);
  return parsed.foundedDate !== null;
};
