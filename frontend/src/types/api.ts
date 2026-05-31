export interface ErrorResponse {
  message: string;
}

export interface Response<T> {
  data: T;
  error: ErrorResponse | null;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}
