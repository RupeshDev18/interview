import type { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

type RequestPart = 'body' | 'query' | 'params';

export function validate<T extends ZodSchema>(
  schema: T,
  part: RequestPart = 'body',
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      next(result.error);
      return;
    }
    // Replace with parsed/coerced values
    req[part] = result.data;
    next();
  };
}

// Common query schemas
export const paginationQuerySchema = z.object({
  page: z.string().optional().transform(Number).pipe(z.number().min(1).default(1)),
  limit: z.string().optional().transform(Number).pipe(z.number().min(1).max(100).default(20)),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
