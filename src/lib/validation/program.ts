import { z } from "zod";
import { sanitizeTextForJsonStorage } from "@/lib/company/sanitize-json-text";

export const programStatusSchema = z.enum(["draft", "published", "closed"]);

export type ProgramStatus = z.infer<typeof programStatusSchema>;

export const PROGRAM_STATUS_OPTIONS: ReadonlyArray<{
  value: ProgramStatus;
  label: string;
}> = [
  { value: "draft", label: "draft (임시)" },
  { value: "published", label: "published (게시)" },
  { value: "closed", label: "closed (마감)" },
];

export const programStatusUpdateSchema = z.object({
  status: programStatusSchema,
});

export const programInputSchema = z.object({
  title: z.string().min(1),
  agency: z.string().min(1),
  category: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  applicationStartDate: z.string().optional().nullable(),
  applicationEndDate: z.string().optional().nullable(),
  status: programStatusSchema.default("draft"),
  content: z.string().min(1, "공고 원문 PDF를 업로드해 주세요."),
});

export type ProgramInput = z.infer<typeof programInputSchema>;

const toContentRaw = (content: string): string => sanitizeTextForJsonStorage(content);

export const toProgramInsertRow = (input: ProgramInput, userId: string) => ({
  title: input.title,
  agency: input.agency,
  category: input.category ?? null,
  region: input.region ?? null,
  application_start_date: input.applicationStartDate ?? null,
  application_end_date: input.applicationEndDate ?? null,
  status: input.status,
  content_raw: toContentRaw(input.content),
  created_by: userId,
  updated_by: userId,
});

export const toProgramUpdateRow = (input: ProgramInput, userId: string) => ({
  title: input.title,
  agency: input.agency,
  category: input.category ?? null,
  region: input.region ?? null,
  application_start_date: input.applicationStartDate ?? null,
  application_end_date: input.applicationEndDate ?? null,
  status: input.status,
  content_raw: toContentRaw(input.content),
  updated_by: userId,
});
