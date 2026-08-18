import type { Response } from 'express';
import type { ApiSuccessResponse } from '@intvwplt/shared';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
): void {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, data: T, message?: string): void {
  sendSuccess(res, data, message, 201);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}

export function sendPaginated<T>(
  res: Response,
  items: T[],
  pagination: { page: number; limit: number; total: number; totalPages: number },
  message?: string,
): void {
  res.status(200).json({
    success: true,
    data: items,
    items,
    pagination,
    ...(message && { message }),
  });
}

