import { prisma } from "@/config/prisma-config.js";
import { revokeRefreshToken } from "./auth-utils.js";

// Find or create user by phone
export const findOrCreateUserByPhone = async (phoneNumber: string) => {
  // upsert user by phone
  const exisiting = await prisma.user.findUnique({
    where: { phoneNumber },
  });
  if (exisiting) return exisiting;
  const user = await prisma.user.create({
    data: { phoneNumber },
  });
  return user;
};

// Attach refresh token to user and store last refresh id
export const attachRefreshTokenService = async (
  userId: string,
  refreshTid: string
) => {
  try {
    return prisma.user.update({
      where: { id: userId },
      data: {
        lastRefreshId: refreshTid,
      },
    });
  } catch (error) {
    return null;
  }
};

// Revoke refresh token and delete last refresh id
export const revokeRefreshTokenService = async (
  userId: string,
  refreshTid: string
) => {
  await revokeRefreshToken(refreshTid);
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastRefreshId: null,
      },
    });
  } catch (error) {
    // Ignore error if user not found
  }
};
