import { z } from "zod";
import { toStoredAddressFields } from "@/lib/company/address-fields";
import { parseFoundedDateInput } from "@/lib/company/founded-date";
import { companyFinancialsSchema, sanitizeStoredFinancials } from "@/lib/company/financials";

export const companyInputSchema = z.object({
  companyName: z.string().min(1),
  businessNumber: z.string().min(1),
  industry: z.string().min(1),
  addressBase: z.string().min(1),
  addressDetail: z.string().default(""),
  foundedDate: z.string().optional().default(""),
  certifications: z.array(z.string()).default([]),
  patents: z.array(z.string()).default([]),
  financials: companyFinancialsSchema,
});

export type CompanyInput = z.infer<typeof companyInputSchema>;

const toFoundedFields = (foundedDateRaw: string) => {
  const parsed = parseFoundedDateInput(foundedDateRaw);
  return {
    founded_date: parsed.foundedDate,
    founded_year: parsed.foundedYear,
  };
};

export const toCompanyRow = (input: CompanyInput, ownerId: string) => ({
  owner_id: ownerId,
  company_name: input.companyName,
  business_number: input.businessNumber,
  industry: input.industry,
  ...toStoredAddressFields(input.addressBase, input.addressDetail),
  ...toFoundedFields(input.foundedDate),
  certifications: input.certifications,
  patents: input.patents,
  financials: sanitizeStoredFinancials(input.financials),
});

export const toCompanyUpdate = (input: CompanyInput) => ({
  company_name: input.companyName,
  business_number: input.businessNumber,
  industry: input.industry,
  ...toStoredAddressFields(input.addressBase, input.addressDetail),
  ...toFoundedFields(input.foundedDate),
  certifications: input.certifications,
  patents: input.patents,
  financials: sanitizeStoredFinancials(input.financials),
});
