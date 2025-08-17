import { Prisma } from "@/generated/prisma/client.js";
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

// APPLICATIONS

export const applicationJobSelect = {
  id: true,
  title: true,
  company: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.JobSelect;

export const applicationListSelect = {
  id: true,
  status: true,
  appliedAt: true,
  job: { select: applicationJobSelect },
} satisfies Prisma.JobApplicationSelect;

export type ApplicationListItem = Prisma.JobApplicationGetPayload<{
  select: typeof applicationListSelect;
}>;
