export interface IResponse<T> {
  success: boolean;
  data: T | null; // allow null for error responses
  message: string;
  errors?: unknown;
  statusCode?: number; // optional HTTP status code
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
}

export type PaginatedResponse<T> = IResponse<T[]> & {
  meta: PaginationMeta; // strictly for paginated responses
};

export class ApiResponse {
  static success<T>(data: T, message = "Success"): IResponse<T> {
    return { success: true, data, message };
  }

  static paginated<T>(
    data: T[],
    meta: PaginationMeta,
    message = "Success"
  ): PaginatedResponse<T> {
    return { success: true, data, message, meta };
  }

  static error<T = null>(
    message = "Error",
    statusCode: number,
    errors?: unknown
  ): IResponse<T> {
    return { success: false, data: null, message, errors, statusCode };
  }
}
