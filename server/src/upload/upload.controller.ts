import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UploadedFiles,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ResponseDto } from 'src/common/dto/response.dto';
import { RequestUrlsDto } from './dto/request-urls.dto';
import { UploadService } from './upload.service';
import { UploadCompleteDto } from './dto/upload-complete.dto';

@ApiTags('Upload')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // **************** S3 Presigned URL 발급 및 파일 업로드 준비 요청 ****************
  @Post('request-urls')
  @HttpCode(HttpStatus.ACCEPTED)
  async requesturls(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: RequestUrlsDto,
    @Req() req: Request,
  ): Promise<
    ResponseDto<{
      urls: Array<{ fileIndex: number; signedUrl: string; s3Key: string }>;
      albumId?: number;
    }>
  > {
    console.log('[upload.controller]request-urls incoming request!');
    const ownerId = (req.user as any).id;
    const { message, urls, albumId } = await this.uploadService.readyToUpload(
      ownerId,
      body,
    );

    return ResponseDto.success(HttpStatus.ACCEPTED, message, {
      urls,
      albumId,
    });
  }

  // **************** Presigned URL 요청 후 업로드 파이프라인 시작 요청 ****************
  @Post('request-processing')
  @HttpCode(HttpStatus.ACCEPTED)
  async requestProcessing(
    @Body() body: UploadCompleteDto,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    console.log('[upload.controller]request-processing incoming request!');
    const ownerId = (req.user as any).id;

    const { message } = await this.uploadService.requestProcessing(
      ownerId,
      body.s3Keys,
      body.albumId,
    );

    return ResponseDto.successWithoutData(HttpStatus.ACCEPTED, message);
  }
}
