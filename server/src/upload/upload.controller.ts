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
import {
  GetMediaPresignedUrlReqDto,
  GetMediaPresignedUrlResDto,
} from './dto/get-presigned-url.dto';
import { RequestFileProcessingReqDto } from './dto/request-file-processing.dto';
import { MediaPipelineService } from 'src/media-pipeline/media-pipeline.service';

@ApiTags('Upload')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly mediaPipelineService: MediaPipelineService) {}

  // **************** S3 Presigned URL 발급 및 파일 업로드 준비 요청 ****************
  @Post('request-urls')
  @HttpCode(HttpStatus.ACCEPTED)
  async getMediaPresignedUrls(
    @Body() body: GetMediaPresignedUrlReqDto,
    @Req() req: Request,
  ): Promise<ResponseDto<GetMediaPresignedUrlResDto>> {
    const ownerId = (req.user as any).id;
    const { message, urls, albumId } =
      await this.mediaPipelineService.readyToUpload(ownerId, body);

    return ResponseDto.success(HttpStatus.ACCEPTED, message, {
      urls,
      albumId,
    });
  }

  // **************** Presigned URL 요청 후 업로드 파이프라인 시작 요청 ****************
  @Post('request-processing')
  @HttpCode(HttpStatus.ACCEPTED)
  async requestFileProcessing(
    @Body() dto: RequestFileProcessingReqDto,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const ownerId = (req.user as any).id;
    const { message } = await this.mediaPipelineService.requestFileProcessing(
      ownerId,
      dto,
    );

    return ResponseDto.successWithoutData(HttpStatus.ACCEPTED, message);
  }
}
