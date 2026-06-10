import { BadRequestException } from '@nestjs/common';
import type { PageResult } from '@company/api-contract';

export const readId = (value: string) => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestException('Invalid id');
  }

  return id;
};

export const readStatus = (status?: string) => {
  if (!status) {
    throw new BadRequestException('Missing status');
  }

  return status;
};

export interface PaginationOptions {
  page: number;
  pageSize: number;
  offset: number;
}

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export const readPagination = (page?: string, pageSize?: string): PaginationOptions => {
  const parsedPage = page === undefined || page === '' ? 1 : Number(page);
  const parsedPageSize =
    pageSize === undefined || pageSize === '' ? DEFAULT_PAGE_SIZE : Number(pageSize);

  if (!Number.isInteger(parsedPage) || parsedPage <= 0) {
    throw new BadRequestException('Invalid page');
  }

  if (!Number.isInteger(parsedPageSize) || parsedPageSize <= 0) {
    throw new BadRequestException('Invalid pageSize');
  }

  const normalizedPageSize = Math.min(parsedPageSize, MAX_PAGE_SIZE);

  return {
    page: parsedPage,
    pageSize: normalizedPageSize,
    offset: (parsedPage - 1) * normalizedPageSize,
  };
};

export const toPageResult = <T>(
  items: T[],
  total: number,
  pagination: PaginationOptions,
): PageResult<T> => ({
  items,
  total,
  page: pagination.page,
  pageSize: pagination.pageSize,
});
