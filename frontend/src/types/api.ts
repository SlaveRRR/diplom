export interface ErrorResponse {
  message: string;
}

export interface Response<T> {
  data: T;
  error: ErrorResponse | null;
}
