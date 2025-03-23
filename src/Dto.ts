import { int } from "aws-sdk/clients/datapipeline";

export const commonResDto = (success: boolean, code: int, message: string, data: any) => {
  return {
    success,
    code,
    message,
    data,
  };
};
