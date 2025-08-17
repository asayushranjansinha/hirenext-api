import prisma from "@/config/prisma-config.js";
import { Prisma } from "@/generated/prisma/client.js";

import {
  createCacheKey,
  deleteCache,
  getOrSetCache,
  invalidateTag,
} from "@/utils/redis-utils.js";
import { companySelect, Company } from "./company-types.js";
import { CACHE_TAGS } from "@/constants/cache-tags.js";

const CACHE_TTL = 300; // 5 minutes

// Create company
export const create = async (
  userId: string,
  data: Omit<Prisma.CompanyCreateInput, "jobs" | "createdBy">
): Promise<Company> => {
  // Invalidate global company list cache
  await invalidateTag(CACHE_TAGS.COMPANY);

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
    [
      `${CACHE_TAGS.COMPANY_ALL}:${id}`, // Company-specific tag for all its data
      CACHE_TAGS.COMPANY, // Global company tag
    ],
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
    invalidateTag(`${CACHE_TAGS.COMPANY_ALL}:${id}`), // Clear company-specific cache
    invalidateTag(CACHE_TAGS.COMPANY), // Clear global company cache
    deleteCache(createCacheKey("company:detail", [id])), // Clear specific cache key
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
    invalidateTag(`${CACHE_TAGS.COMPANY_ALL}:${id}`), // Clear all company data (including jobs)
    invalidateTag(CACHE_TAGS.COMPANY), // Clear global company cache
    invalidateTag(CACHE_TAGS.JOBS), // Clear jobs cache as company jobs will be affected
    deleteCache(createCacheKey("company:detail", [id])), // Clear specific cache key
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
