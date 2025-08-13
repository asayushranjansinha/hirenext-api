import { UserRole } from "@/generated/prisma/enums.js";

export type UserType = {
  id: string;
  phoneNumber: string | null;
  name?: string | null;
  role: UserRole;
};

export interface UserResponse {
  user: UserType | null;
}