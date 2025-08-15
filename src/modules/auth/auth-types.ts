import { UserRole } from "@/generated/prisma/enums.js";

export type AuthUser = {
  id: string;
  phoneNumber: string;
  name: string | null;
  role: UserRole;
  hasOnboarded: boolean;
};
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: AuthUser | null;
  tokens: AuthTokens | null;
}
