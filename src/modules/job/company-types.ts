import { Prisma } from "@/generated/prisma/client.js";

export const companySelect = {
  id: true,
  name: true,
  website: true,
  createdById: true,
} satisfies Prisma.CompanySelect;

export type Company = Prisma.CompanyGetPayload<{
  select: typeof companySelect;
}>;
