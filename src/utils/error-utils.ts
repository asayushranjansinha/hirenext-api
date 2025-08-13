import { z, ZodError } from "zod";

export function parseZodError(error: ZodError): string {
  return z.prettifyError(error);
}
