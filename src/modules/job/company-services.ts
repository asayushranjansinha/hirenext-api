import prisma from "@/config/prisma-config.js";
import { Prisma } from "@/generated/prisma/client.js";

import {
  createCacheKey,
  deleteCache,
  getOrSetCache,
  invalidateTag,
} from "@/utils/redis-utils.js";
import { companySelect, Company } from "./company-types.js";

const CACHE_TTL = 300; // 5 minutes
const CACHE_TAGS = {
  JOBS: "jobs", // Global jobs list (unfiltered)
  COMPANY: "company", // Global company list / details
  COMPANY_ALL: "company-all", // All company-related data (company + its jobs)
} as const;

// Create company
export const create = async (
  userId: string,
  data: Omit<Prisma.CompanyCreateInput, "jobs" | "createdBy">
): Promise<Company> => {
  return prisma.company.create({
    data: {
      ...data,
      createdById: userId,
      createdAt: new Date(),
    },
    select: companySelect,
  });
};

// Get company by ID (with caching)
export const findById = async (id: string): Promise<Company | null> => {
  const cacheKey = createCacheKey("company:detail", [id]);
  return getOrSetCache(
    cacheKey,
    CACHE_TTL,
    [`${CACHE_TAGS.COMPANY_ALL}:${id}`], // tagged so delete/update clears it
    async () => {
      return prisma.company.findUnique({
        where: { id },
        select: companySelect,
      });
    }
  );
};

// Update company
export const update = async (
  id: string,
  data: Omit<Prisma.CompanyUpdateInput, "jobs">
): Promise<Company> => {
  await Promise.all([
    invalidateTag(`${CACHE_TAGS.COMPANY_ALL}:${id}`),
    deleteCache(createCacheKey("company:detail", [id])),
  ]);

  return prisma.company.update({
    where: { id },
    data,
    select: companySelect,
  });
};

// Delete company
export const deleteOne = async (id: string): Promise<void> => {
  await Promise.all([
    invalidateTag(`${CACHE_TAGS.COMPANY_ALL}:${id}`),
    deleteCache(createCacheKey("company:detail", [id])),
  ]);

  await prisma.company.delete({ where: { id } });
};

// Find by where
export const findOne = (
  where: Prisma.CompanyWhereInput
): Promise<Company | null> => {
  const cacheKey = createCacheKey("company:detail", [where]);
  return getOrSetCache(cacheKey, CACHE_TTL, [CACHE_TAGS.COMPANY], async () => {
    return prisma.company.findFirst({
      where,
      select: companySelect,
    });
  });
};
