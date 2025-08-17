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
  ApplicationDetail,
  applicationDetailSelect,
  JobDetail,
  jobDetailSelect,
  JobFilters,
  JobListItem,
  jobListSelect,
} from "./job-types.js";
import { CACHE_TAGS } from "@/constants/cache-tags.js";

const CACHE_TTL = 300; // 5 minutes

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
    invalidateTag(`${CACHE_TAGS.JOB_APPLICATIONS}:${id}`), // Clear applications for this job
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
  // Invalidate all related caches before creating
  await Promise.all([
    // invalidateTag(CACHE_TAGS.JOBS), // Global jobs, uncomment this if want realtime updated but higher db load
    invalidateTag(CACHE_TAGS.APPLICATIONS), // Global applications
    invalidateTag(`${CACHE_TAGS.JOB_APPLICATIONS}:${jobId}`), // Job-specific applications
    invalidateTag(`${CACHE_TAGS.USER_APPLICATIONS}:${applicantId}`), // User-specific applications
    deleteCache(createCacheKey("job:detail", [jobId])), // Job detail (for fresh application count)
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

// Find application by ID
export const findApplicationByID = async (
  id: string
): Promise<ApplicationDetail | null> => {
  const cacheKey = createCacheKey("application:detail", [id]);

  const cached = await getCache(cacheKey);
  if (cached) return JSON.parse(cached) as ApplicationDetail;

  const app = await prisma.jobApplication.findUnique({
    where: { id },
    select: applicationDetailSelect,
  });

  if (!app) return null;

  await setWithTags(cacheKey, JSON.stringify(app), CACHE_TTL, [
    CACHE_TAGS.APPLICATIONS,
    `${CACHE_TAGS.JOB_APPLICATIONS}:${app.jobId}`,
    `${CACHE_TAGS.USER_APPLICATIONS}:${app.applicantId}`,
  ]);

  return app;
};

// Update application Status (Recruiter)
export const updateApplicationStatus = async (
  applicationId: string,
  status: ApplicationStatus,
  notes?: string
) => {
  // Get application
  const application = await findApplicationByID(applicationId);
  if (!application) return null;

  const updated = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: {
      status,
      ...(notes && { notes }),
    },
    select: applicationDetailSelect,
  });

  // Invalidate related caches
  await Promise.all([
    invalidateTag(CACHE_TAGS.APPLICATIONS),
    invalidateTag(`${CACHE_TAGS.JOB_APPLICATIONS}:${application.jobId}`),
    invalidateTag(`${CACHE_TAGS.USER_APPLICATIONS}:${application.applicantId}`),
    deleteCache(createCacheKey("application:detail", [applicationId])),
  ]);

  return updated;
};
