import axios from "axios";

/** Check whether an error is an Axios HTTP error with the given status code. */
export const isHttpError = (error: unknown, status: number): boolean => {
  return axios.isAxiosError(error) && error.response?.status === status;
};

/** Check whether an error is a 403 Forbidden response. */
export const isForbiddenError = (error: unknown): boolean => {
  return isHttpError(error, 403);
};

/** Check whether an error is a 404 Not Found response. */
export const isNotFoundError = (error: unknown): boolean => {
  return isHttpError(error, 404);
};
