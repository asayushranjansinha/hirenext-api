import { prisma } from "@/config/prisma-config.js";
import { Prisma } from "@/generated/prisma/client.js";

import {
  createCacheKey,
  getOrSetCache,
  invalidateTag,
} from "@/utils/redis-utils.js";
import { applicationListSelect } from "./user-types.js";
import { CACHE_TAGS } from "@/constants/cache-tags.js";

const CACHE_TTL = 300; // 5 minutes


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
    [`${CACHE_TAGS.USER}:${id}`], // Use consistent user tag
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

  // Invalidate user-specific cache
  await invalidateTag(`${CACHE_TAGS.USER}:${id}`);

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
    [
      `${CACHE_TAGS.USER_APPLICATIONS}:${userId}`,
      CACHE_TAGS.APPLICATIONS, // Also tag with global applications
    ],
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
