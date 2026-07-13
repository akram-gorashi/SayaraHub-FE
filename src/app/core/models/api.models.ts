export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface PagedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PageQuery {
  pageNumber?: number;
  pageSize?: number;
}

export type EmptyResult = Record<string, never>;

export type QueryValue = string | number | boolean | Date | readonly (string | number)[] | null | undefined;
export type QueryParams = Record<string, QueryValue>;
