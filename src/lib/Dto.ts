import { CommonResDto } from "./interfaces";

export const commonResDto = <T>(
  success: boolean,
  code: number,
  message: string,
  data: T
): CommonResDto<T> => {
  return { success, code, message, data };
};
