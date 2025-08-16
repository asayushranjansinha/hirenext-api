import type { Request, Response } from "express";
import { Prisma } from "@/generated/prisma/client.js";

import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "@/utils/app-error.js";
import { logger } from "@/config/logger-config.js";
import { ApiResponse } from "@/utils/api-response.js";
import { parseZodError } from "@/utils/error-utils.js";

import {
  companyIdSchema,
  createSchema,
  updateSchema,
} from "./company-validations.js";
import {
  create,
  deleteOne,
  findById,
  findOne,
  update,
} from "./company-services.js";
import { Company } from "./company-types.js";

/**
 * @route   POST /companies/
 * @desc    Post a new company
 * @access  Private (only accessible to ADMIN | SUPER_ADMIN | RECRUITER)
 */
export const createController = async (req: Request, res: Response) => {
  logger.info(`CompanyControllers: createController → Start`);

  // Validate user id
  const userId = req.user!.id;
  logger.info(`CompanyControllers: createController → User ID: ${userId}`);

  // Validate request body
  const body = createSchema.safeParse(req.body);
  if (!body.success) {
    const message = parseZodError(body.error);
    logger.error(
      `CompanyControllers: createController → Validation failed: ${message}`
    );
    throw new BadRequestError(message);
  }

  // Destructure body data
  const { name, website } = body.data;

  // Check if company with same name or website already exists
  const existingCompany = await findOne({
    OR: [{ name }, { website }],
  });
  if (existingCompany) {
    logger.error(
      `CompanyControllers: createController → Company already exists: ${existingCompany.name}`
    );
    throw new ConflictError("Company with same name or website already exists");
  }

  // Create new company
  const newCompany = await create(userId, { name, website });
  logger.info(
    `Company Controllers: createController → Company created: ${newCompany.name}`
  );

  // Send new response to client
  return res
    .status(201)
    .json(
      ApiResponse.success<Company>(newCompany, "Company created successfully")
    );
};

/**
 * @route   GET /companies/:id
 * @desc    Get a single company by ID
 * @access  Public
 */
export const getOneController = async (req: Request, res: Response) => {
  logger.info(`CompanyControllers: getOneController → Start`);

  // Validate request params
  const params = companyIdSchema.safeParse(req.params);
  if (!params.success) {
    const message = parseZodError(params.error);
    logger.error(
      `CompanyControllers: getOneController → Invalid company ID: ${req.params.id}`
    );
    throw new BadRequestError(message);
  }

  // Destructure params
  const { id } = params.data;

  // Find company by ID
  const company = await findById(id);
  if (!company) {
    logger.error(
      `CompanyControllers: getOneController → Company not found: ${id}`
    );
    throw new NotFoundError("Company not found");
  }

  // Send response to client
  return res
    .status(200)
    .json(
      ApiResponse.success<Company>(company, "Company retrieved successfully")
    );
};

/**
 * @route   PUT /companies/:id
 * @desc    Update a company by ID
 * @access  Private (only accessible to ADMIN | SUPER_ADMIN | RECRUITER)
 */
export const updateController = async (req: Request, res: Response) => {
  logger.info(`CompanyControllers: updateController → Start`);

  // Validate user id
  const userId = req.user!.id;
  logger.info(`CompanyControllers: updateController → User ID: ${userId}`);

  // Validate request params
  const params = companyIdSchema.safeParse(req.params);
  if (!params.success) {
    const message = parseZodError(params.error);
    logger.error(
      `CompanyControllers: updateController → Invalid company ID: ${req.params.id}`
    );
    throw new BadRequestError(message);
  }

  // Validate request body
  const body = updateSchema.safeParse(req.body);
  if (!body.success) {
    const message = parseZodError(body.error);
    logger.error(
      `CompanyControllers: updateController → Validation failed: ${message}`
    );
    throw new BadRequestError(message);
  }

  // Destructure params
  const { id } = params.data;

  // Find company by ID
  const company = await findById(id);
  if (!company) {
    logger.error(
      `CompanyControllers: updateController → Company not found: ${id}`
    );
    throw new NotFoundError("Company not found");
  }

  // Check if user is the creator of the company
  if (company.createdById !== userId) {
    logger.error(
      `CompanyControllers: updateController → User not authorized to update company: ${id}`
    );
    throw new UnauthorizedError();
  }

  // Update company
  const updated = await update(id, body.data);
  logger.info(
    `CompanyControllers: updateController → Company updated: ${updated.name}`
  );

  // Send response to client
  return res
    .status(200)
    .json(
      ApiResponse.success<Company>(updated, "Company updated successfully")
    );
};

/**
 * @route   DELETE /companies/:id
 * @desc    Delete a company by ID
 * @access  Private (only accessible to ADMIN | SUPER_ADMIN | RECRUITER)
 */
export const deleteController = async (req: Request, res: Response) => {
  logger.info(`CompanyControllers: deleteController → Start`);

  // Validate user id
  const userId = req.user!.id;
  logger.info(`CompanyControllers: deleteController → User ID: ${userId}`);

  // Validate request params
  const params = companyIdSchema.safeParse(req.params);
  if (!params.success) {
    const message = parseZodError(params.error);
    logger.error(
      `CompanyControllers: deleteController → Invalid company ID: ${req.params.id}`
    );
    throw new BadRequestError(message);
  }

  // Destructure params
  const { id } = params.data;

  // Check if company exists
  const company = await findById(id);
  if (!company) {
    logger.error(
      `CompanyControllers: deleteController → Company not found: ${id}`
    );
    throw new NotFoundError("Company does not exist");
  }

  // Check if user is the creator of the company
  if (company.createdById !== userId) {
    logger.error(
      `CompanyControllers: deleteController → User not authorized to delete company: ${id}`
    );
    throw new UnauthorizedError();
  }

  try {
    await deleteOne(id);
    logger.info(
      `CompanyControllers: deleteController → Company deleted: ${id}`
    );

    return res
      .status(200)
      .json(ApiResponse.success(null, "Company deleted successfully"));
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      logger.error(
        `CompanyControllers: deleteController → Company not found: ${id}`
      );
      throw new NotFoundError("Company does not exist");
    } else throw err;
  }
};
