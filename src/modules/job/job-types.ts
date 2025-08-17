import { Prisma } from "@/generated/prisma/client.js";
import { JobType } from "@/generated/prisma/enums.js";

// Company select for job relations
export const jobCompanySelect = {
  id: true,
  name: true,
  website: true,
} satisfies Prisma.CompanySelect;

// User select for job relations
export const jobUserSelect = {
  id: true,
  name: true,
  email: true,
} satisfies Prisma.UserSelect;

// Job list select (minimal data for listing)
export const jobListSelect = {
  id: true,
  title: true,
  description: true,
  type: true,
  salaryRange: true,
  postingUrl: true,
  isOpen: true,
  postedAt: true,
  expiresAt: true,
  companyId: true,
  company: { select: jobCompanySelect },
  _count: { select: { applications: true } },
} satisfies Prisma.JobSelect;

// Job detail select (full data for single job)
export const jobDetailSelect = {
  id: true,
  title: true,
  description: true,
  type: true,
  overview: true,
  companyId: true,
  salaryRange: true,
  postingUrl: true,
  requirements: true,
  benefits: true,
  responsibilities: true,
  skills: true,
  isOpen: true,
  expiresAt: true,
  postedAt: true,
  updatedAt: true,
  createdById: true,
  company: { select: jobCompanySelect },
  createdBy: { select: jobUserSelect },
  _count: { select: { applications: true } },
} satisfies Prisma.JobSelect;

// Generated types from Prisma
export type JobListItem = Prisma.JobGetPayload<{
  select: typeof jobListSelect;
}>;

export type JobDetail = Prisma.JobGetPayload<{
  select: typeof jobDetailSelect;
}>;

// Query filters
export type JobFilters = {
  location?: string;
  type?: JobType;
  companyId?: string;
  keyword?: string;
};

// APPLICATIONS

// application create select (job application response select)
export const applicationCreateSelect = {
  id: true,
  status: true,
  appliedAt: true,
  jobId: true,
  applicantId: true,
} satisfies Prisma.JobApplicationSelect;

export type ApplicationCreateItem = Prisma.JobApplicationGetPayload<{
  select: typeof applicationCreateSelect;
}>;

export const applicationUserSelect = {
  id: true,
  name: true,
  email: true,
  phoneNumber: true,
} satisfies Prisma.UserSelect;

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

export const applicationDetailSelect = {
  id: true,
  status: true,
  appliedAt: true,
  resumeUrl: true,
  coverLetter: true,
  applicantId: true,
  jobId: true,
  applicant: { select: applicationUserSelect },
  job: {
    select: applicationJobSelect,
  },
} satisfies Prisma.JobApplicationSelect;

export type ApplicationDetail = Prisma.JobApplicationGetPayload<{
  select: typeof applicationDetailSelect;
}>;
