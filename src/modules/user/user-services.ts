import { prisma } from "@/config/prisma-config.js";
import { Prisma } from "@/generated/prisma/client.js";

import {
  createCacheKey,
  getOrSetCache,
  invalidateTag,
} from "@/utils/redis-utils.js";

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
  data: Prisma.UserUpdateInput,
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
