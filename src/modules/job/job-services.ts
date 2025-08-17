import prisma from "@/config/prisma-config.js";
import { Prisma } from "@/generated/prisma/client.js";

import { ApplicationStatus } from "@/generated/prisma/enums.js";
import {
  createCacheKey,
  deleteCache,
  getCache,
  getOrSetCache,
  invalidateTag,
  setWithTags,
} from "@/utils/redis-utils.js";
import {
  ApplicationCreateItem,
  applicationCreateSelect,
  JobDetail,
  jobDetailSelect,
  JobFilters,
  JobListItem,
  jobListSelect
} from "./job-types.js";

const CACHE_TTL = 300; // 5 minutes
const CACHE_TAGS = {
  JOBS: "jobs",
  COMPANY: "company",
  COMPANY_ALL: "company-all",
  APPLICATIONS: "applications",
} as const;

// Create a job entry in database
export const create = async (
  userId: string,
  companyId: string,
  data: Omit<Prisma.JobCreateInput, "company" | "createdBy">
): Promise<JobDetail> => {
  await Promise.all([
    invalidateTag(CACHE_TAGS.JOBS), // clears global job list
    invalidateTag(`${CACHE_TAGS.COMPANY_ALL}:${companyId}`), // clears company + its jobs
  ]);

  return prisma.job.create({
    data: {
      ...data,
      companyId,
      createdById: userId,
      postedAt: new Date(),
      isOpen: true,
    },
    select: jobDetailSelect,
  });
};

// Get jobs by filters
export const findByFilters = async (
  filters: JobFilters,
  page: number = 1,
  limit: number = 10
): Promise<{ jobs: JobListItem[]; total: number }> => {
  const cacheKey = createCacheKey("jobs:list", [filters, page, limit]);

  // Destructure filters
  const { location, type, companyId, keyword } = filters;

  const where: Prisma.JobWhereInput = {
    ...(location && {
      locationKey: { contains: location, mode: "insensitive" },
    }),
    ...(type && { type }),
    ...(companyId && { companyId }),
    ...(keyword && {
      OR: [
        { title: { contains: keyword, mode: "insensitive" } },
        { description: { contains: keyword, mode: "insensitive" } },
      ],
    }),
  };

  return getOrSetCache(cacheKey, CACHE_TTL, [CACHE_TAGS.JOBS], async () => {
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        select: jobListSelect,
        orderBy: { postedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    return { jobs, total };
  });
};

// Get job by ID
export const findById = async (id: string): Promise<JobDetail | null> => {
  const cacheKey = createCacheKey("job:detail", [id]);

  // Try to get from cache
  const cached = await getCache(cacheKey);
  if (cached) {
    return JSON.parse(cached) as JobDetail;
  }

  // Fetch from DB
  const job = await prisma.job.findUnique({
    where: { id },
    select: jobDetailSelect,
  });

  if (!job) return null;

  // Store with tags: global jobs tag + company-specific tag
  await setWithTags(cacheKey, JSON.stringify(job), CACHE_TTL, [
    CACHE_TAGS.JOBS,
    `${CACHE_TAGS.COMPANY_ALL}:${job.companyId}`,
  ]);

  return job;
};

// Update job entry in database
export const update = async (
  id: string,
  companyId: string,
  data: Omit<Prisma.JobUpdateInput, "companyId" | "createdById">
): Promise<JobDetail> => {
  const cacheKey = createCacheKey("job:detail", [id]);
  await Promise.all([
    invalidateTag(CACHE_TAGS.JOBS),
    invalidateTag(`${CACHE_TAGS.COMPANY_ALL}:${companyId}`),
    deleteCache(cacheKey),
  ]);

  return prisma.job.update({
    where: { id },
    data,
    select: jobDetailSelect,
  });
};

// Delete job entry from database
export const deleteOne = async (
  id: string,
  companyId: string
): Promise<void> => {
  await Promise.all([
    invalidateTag(CACHE_TAGS.JOBS),
    invalidateTag(`${CACHE_TAGS.COMPANY_ALL}:${companyId}`),
    deleteCache(createCacheKey("job:detail", [id])),
  ]);

  await prisma.job.delete({ where: { id } });
};

// Toggle job status (open/closed)
export const toggleStatus = async (
  id: string,
  isOpen: boolean
): Promise<JobDetail> => {
  const updated = await prisma.job.update({
    where: { id },
    data: { isOpen },
    select: jobDetailSelect,
  });

  await Promise.all([
    invalidateTag(CACHE_TAGS.JOBS),
    invalidateTag(`${CACHE_TAGS.COMPANY_ALL}:${updated.companyId}`),
    deleteCache(createCacheKey("job:detail", [id])),
  ]);

  return updated;
};

export const findOne = async (
  jobId: string,
  where: Prisma.JobWhereInput
): Promise<JobDetail | null> => {
  const cacheKey = createCacheKey("job:detail", [jobId, where]);

  // Try to get from cache
  const cached = await getCache(cacheKey);
  if (cached) {
    return JSON.parse(cached) as JobDetail;
  }

  const whereInput: Prisma.JobWhereInput = { id: jobId, ...where };
  // Fetch from DB
  const job = await prisma.job.findFirst({
    where: whereInput,
    select: jobDetailSelect,
  });

  if (!job) return null;

  // Store with tags: global jobs tag + company-specific tag
  await setWithTags(cacheKey, JSON.stringify(job), CACHE_TTL, [
    CACHE_TAGS.JOBS,
    `${CACHE_TAGS.COMPANY_ALL}:${job.companyId}`,
  ]);

  return job;
};

// Apply for a job
export const apply = async (
  jobId: string,
  applicantId: string,
  data: Pick<
    Prisma.JobApplicationCreateInput,
    "notes" | "resumeUrl" | "coverLetter"
  >
): Promise<ApplicationCreateItem> => {
  await Promise.all([
    invalidateTag(CACHE_TAGS.APPLICATIONS),
    deleteCache(createCacheKey("job:detail", [jobId])), // so job detail can include fresh applications count
  ]);

  return prisma.jobApplication.create({
    data: {
      applicantId,
      jobId,
      resumeUrl: data.resumeUrl,
      coverLetter: data.coverLetter,
      status: ApplicationStatus.ACCEPTED,
      notes: data.notes ?? undefined,
    },
    select: applicationCreateSelect,
  });
};
