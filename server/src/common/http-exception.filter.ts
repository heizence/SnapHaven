import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { ResponseDto } from './dto/response.dto'; // 경로에 맞게 수정

/**
 * HttpException 을 캐치하여 공용 ResponseDto 형식으로 변환하는 필터
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string;
    let errorData: any = null;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      // NestJS의 기본 유효성 검사(ValidationPipe) 에러 처리
      if (Array.isArray((exceptionResponse as any)?.message)) {
        message = 'Validation failed';
        errorData = (exceptionResponse as any).message; // 유효성 검사 실패 상세 내역
      } else {
        message = (exceptionResponse as any).message || exception.message;
      }
    } else {
      message = exception.message;
    }

    // ResponseDto.fail() 정적 메소드를 사용하여 응답 객체 생성
    const responseDto = ResponseDto.fail(status, message, errorData);

    return response.status(status).json(responseDto);
  }
}
