import { UserRole } from "@/generated/prisma/enums.js";

export type UserType = {
  id: string;
  phoneNumber: string;
  name: string | null;
  role: UserRole;
  hasOnboarded: boolean;
};

export interface UserResponse {
  user: UserType | null;
}