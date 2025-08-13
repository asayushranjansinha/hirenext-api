import { UserRole } from "@/generated/prisma/enums.js";

export type AuthUser = {
  id: string;
  phoneNumber: string | null;
  name?: string | null;
  role: UserRole;
};
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: AuthUser | null;
  tokens: AuthTokens | null;
}
