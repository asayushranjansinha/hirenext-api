import { prisma } from "@/config/prisma-config.js";
import { Prisma } from "@/generated/prisma/client.js";

import {
  createCacheKey,
  getOrSetCache,
  invalidateTag,
} from "@/utils/redis-utils.js";
import { applicationListSelect } from "./user-types.js";

const CACHE_TTL = 300; // 5 minutes
const CACHE_TAGS = {
  USER_APPLICATIONS: "user-applications",
  APPLICATIONS: "applications",
} as const;

export const findByIdService = async (
  id: string,
  select: Prisma.UserSelect = {
    id: true,
    phoneNumber: true,
    role: true,
    hasOnboarded: true,
  }
) => {
  const key = createCacheKey("user:findById", [{ id, select }]);

  return getOrSetCache(
    key,
    300, // TTL in seconds
    [`user:${id}`],
    async () => {
      return prisma.user.findUnique({
        where: { id },
        select,
      });
    }
  );
};

export const updateService = async (
  id: string,
  data: Prisma.UserUpdateInput
) => {
  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...data,
      hasOnboarded: true,
    },
  });

  // Invalidate tag
  const tag = `user:${id}`;
  await invalidateTag(tag);

  return updated;
};

export const findApplications = async (
  userId: string,
  page: number = 1,
  limit: number = 10
) => {
  const cacheKey = createCacheKey("applications:user", [userId, page, limit]);
  return getOrSetCache(
    cacheKey,
    CACHE_TTL,
    [`${CACHE_TAGS.USER_APPLICATIONS}:${userId}`],
    async () => {
      const [applications, total] = await Promise.all([
        prisma.jobApplication.findMany({
          where: { applicantId: userId },
          select: applicationListSelect,
          orderBy: { appliedAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.jobApplication.count({ where: { applicantId: userId } }),
      ]);

      return { applications, total };
    }
  );
};
