import prisma from "@/config/prisma-config.js";
import { Prisma } from "@/generated/prisma/client.js";
import { createCacheKey, getOrSetCache } from "@/utils/redis-utils.js";

export const findByIdService = async (
  id: string,
  select: Prisma.UserSelect = {
    id: true,
    phoneNumber: true,
    role: true,
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
