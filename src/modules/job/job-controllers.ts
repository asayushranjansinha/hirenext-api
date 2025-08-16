import type { Request, Response } from "express";

import { logger } from "@/config/logger-config.js";
import { ApiResponse } from "@/utils/api-response.js";
import { parseZodError } from "@/utils/error-utils.js";
import { BadRequestError, UnauthorizedError } from "@/utils/app-error.js";

import { findById as findCompanyById } from "./company-services.js";
import {
  create,
  deleteOne,
  findByFilters,
  findById,
  toggleStatus,
  update,
} from "./job-services.js";
import { JobDetail } from "./job-types.js";
import {
  createSchema,
  filterSchema,
  jobIdSchema,
  updateSchema,
} from "./job-validations.js";
import { normalizeString } from "./job-utils.js";

/**
 * @route   POST /jobs/
 * @desc    Post a new job
 * @access  Private (only accessible to ADMIN | SUPER_ADMIN | RECRUITER)
 */
export const createController = async (req: Request, res: Response) => {
  logger.info(`JobControllers: createController → Start`);

  // Validate user id
  const userId = req.user!.id;
  logger.info(`JobControllers: createController → User ID: ${userId}`);

  // Validate request body with Zod
  const body = createSchema.safeParse(req.body);
  if (!body.success) {
    const message = parseZodError(body.error);
    logger.error(
      `JobControllers: createController → Validation failed: ${message}`
    );
    throw new BadRequestError(message);
  }
  logger.debug(
    `JobControllers: createController → Request validation successful`
  );
  const data = body.data;

  // Normalize location
  let locationKey = undefined;
  if (data.location) {
    locationKey = normalizeString(data.location);
  }

  // Verify company exists
  const companyId = data.companyId;
  const company = await findCompanyById(companyId);
  if (!company) {
    logger.error(
      `JobControllers: createController → Company not found: ${companyId}`
    );
    throw new BadRequestError("Company does not exist");
  }

  // Create job
  logger.debug("JobControllers: createController → Creating job in database");
  const job = await create(userId, companyId, {
    ...data,
    locationKey,
  });
  logger.info(`JobControllers: createController → Job created: ${job.id}`);

  // Send response to client
  return res
    .status(201)
    .json(ApiResponse.success<JobDetail>(job, "Job created successfully"));
};

/**
 * @route   PUT /jobs/:id
 * @desc    Update job by id
 * @access  Private (only accessible to ADMIN | SUPER_ADMIN | RECRUITER)
 */
export const updateController = async (req: Request, res: Response) => {
  logger.info(`JobControllers: updateController → Start`);

  // Validate user id
  const userId = req.user!.id;
  logger.info(`JobControllers: updateController → User ID: ${userId}`);

  // Validate job id
  const params = jobIdSchema.safeParse(req.params);
  if (!params.success) {
    const message = parseZodError(params.error);
    logger.error(
      `JobControllers: updateController → Invalid job ID: ${req.params.id}`
    );
    throw new BadRequestError(message);
  }

  // Validate request body
  const body = updateSchema.safeParse(req.body);
  if (!body.success) {
    const message = parseZodError(body.error);
    logger.error(
      `JobControllers: updateController → Validation failed: ${message}`
    );
    throw new BadRequestError(message);
  }

  // Destructure request
  const { data } = body;
  const { id } = params.data;

  // Verify if job exists
  const job = await findById(id);
  if (!job) {
    logger.error(`JobControllers: updateController → Job not found: ${id}`);
    throw new BadRequestError("Job does not exist");
  }

  // Check if user is the owner of the job
  if (job.createdById !== userId) {
    logger.error(
      `JobControllers: updateController → User not authorized to update job: ${id}`
    );
    throw new UnauthorizedError();
  }

  // Update job
  logger.debug("JobControllers: updateController → Updating job in database");
  const updated = await update(id, job.companyId, data);
  logger.info(`JobControllers: updateController → Job updated: ${id}`);

  // Send response to client
  return res
    .status(200)
    .json(ApiResponse.success<JobDetail>(updated, "Job updated successfully"));
};

/**
 * @route   DELETE /jobs/:id
 * @desc    Delete job by id
 * @access  Private (only accessible to ADMIN | SUPER_ADMIN | RECRUITER)
 */
export const deleteController = async (req: Request, res: Response) => {
  logger.info(`JobControllers: deleteController → Start`);

  // Validate user id
  const userId = req.user!.id;
  logger.info(`JobControllers: deleteController → User ID: ${userId}`);

  // Validate job id
  const params = jobIdSchema.safeParse(req.params);
  if (!params.success) {
    const message = parseZodError(params.error);
    logger.error(
      `JobControllers: deleteController → Invalid job ID: ${req.params.id}`
    );
    throw new BadRequestError(message);
  }

  // Destructure request
  const { id } = params.data;

  // Verify if job exists
  const job = await findById(id);
  if (!job) {
    logger.error(`JobControllers: deleteController → Job not found: ${id}`);
    throw new BadRequestError("Job not found");
  }

  // Check if user is the owner of the job
  if (job.createdById !== userId) {
    logger.error(
      `JobControllers: deleteController → User not authorized to delete job: ${id}`
    );
    throw new UnauthorizedError("User not authorized to delete job");
  }

  // Delete job
  logger.debug("JobControllers: deleteController → Deleting job from database");
  await deleteOne(id, job.companyId);
  logger.info(`JobControllers: deleteController → Job deleted: ${id}`);

  // Send response to client
  return res
    .status(200)
    .json(ApiResponse.success(null, "Job deleted successfully"));
};

/**
 * @route   GET /jobs/:id
 * @desc    Get job by id
 * @access  Public
 */
export const getDetailsController = async (req: Request, res: Response) => {
  logger.info(`JobControllers: getDetailsController → Start`);

  // Validate job id
  const params = jobIdSchema.safeParse(req.params);
  if (!params.success) {
    const message = parseZodError(params.error);
    logger.error(
      `JobControllers: getDetailsController → Invalid job ID: ${req.params.id}`
    );
    throw new BadRequestError(message);
  }

  // Destructure request
  const { id } = params.data;

  // Verify if job exists
  logger.debug(
    `JobControllers: getDetailsController → Finding job by ID: ${id}`
  );
  const job = await findById(id);
  if (!job) {
    logger.error(`JobControllers: getDetailsController → Job not found: ${id}`);
    throw new BadRequestError("Job not found");
  }

  logger.info(`JobControllers: getDetailsController → Job fetched: ${id}`);

  // Send response to client
  return res
    .status(200)
    .json(ApiResponse.success<JobDetail>(job, "Job fetched successfully"));
};

/**
 * @route   GET /jobs
 * @desc    Get all jobs by filters
 * @access  Public
 */
export const getByFilters = async (req: Request, res: Response) => {
  logger.info(`JobControllers: getByFilters → Start`);

  // Validate request query
  const query = filterSchema.safeParse(req.query);
  if (!query.success) {
    const message = parseZodError(query.error);
    logger.error(
      `JobControllers: getByFilters → Invalid Query params: ${message}`
    );
    throw new BadRequestError(message);
  }

  // Create filter object
  let { page, limit, ...filters } = query.data;
  if (filters.location) {
    filters.location = normalizeString(filters.location);
  }

  logger.info(`JobControllers → getByFilters → Searching for jobs`);

  // Get jobs
  const { jobs, total } = await findByFilters(filters, page, limit);
  const totalPages = Math.ceil(total / limit);

  logger.info(
    `JobControllers → getByFilters → Jobs fetched: ${jobs.length} | Total pages: ${totalPages}`
  );

  // Send response to client
  return res.json(
    ApiResponse.paginated(jobs, {
      page,
      limit,
      totalItems: total,
      totalPages,
      hasMore: page < totalPages,
    })
  );
};

/**
 * @route PATCH /jobs/:id/toggle-status
 * @desc Toggle job status (open/closed)
 * @access Private (only accessible to ADMIN | SUPER_ADMIN | RECRUITER)
 */
export const toggleStatusController = async (req: Request, res: Response) => {
  logger.info(`JobControllers: toggleStatusController → Start`);

  // Validate user id
  const userId = req.user!.id;
  logger.info(`JobControllers: toggleStatusController → User ID: ${userId}`);

  // Validate job id
  const params = jobIdSchema.safeParse(req.params);
  if (!params.success) {
    const message = parseZodError(params.error);
    logger.error(
      `JobControllers: toggleStatusController → Invalid job ID: ${req.params.id}`
    );
    throw new BadRequestError(message);
  }

  // Destructure request
  const { id } = params.data;

  // Verify if job exists
  const job = await findById(id);
  if (!job) {
    logger.error(
      `JobControllers: toggleJobStatusController → Job not found: ${id}`
    );
    throw new BadRequestError("Job not found");
  }

  // Check if user is the owner of the job
  if (job.createdById !== userId) {
    logger.error(
      `JobControllers: toggleJobStatusController → User not authorized to update job: ${id}`
    );
    throw new UnauthorizedError();
  }

  // Update job
  logger.info(`JobControllers: toggleStatusController → Updating job status`);
  const updated = await toggleStatus(id, job.isOpen);
  logger.info(
    `JobControllers: toggleJobStatusController → Job status updated: ${id}`
  );

  // Send response to client
  return res
    .status(200)
    .json(
      ApiResponse.success<JobDetail>(updated, "Job status updated successfully")
    );
};
