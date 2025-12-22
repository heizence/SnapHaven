import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  Query,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ResponseDto } from 'src/common/dto/response.dto';
import {
  GetMediaPresignedUrlReqDto,
  GetMediaPresignedUrlResDto,
} from './dto/get-presigned-url.dto';
import { RequestFileProcessingReqDto } from './dto/request-file-processing.dto';
import { MediaPipelineService } from 'src/media-pipeline/media-pipeline.service';
import {
  ApiGetMediaPresignedUrls,
  ApiRequestFileProcessing,
} from './decorators/swagger.upload.decorators';
import { User } from 'src/users/entities/user.entity';
import {
  CompleteMultipartUploadReqDto,
  EachPresignedPartDto,
  GetPresignedPartsReqDto,
  InitiateMultipartUploadReqDto,
  InitiateMultipartUploadResDto,
} from './dto/multipart-upload.dto';

@ApiTags('Upload')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly mediaPipelineService: MediaPipelineService) {}

  // **************** S3 Presigned URL 발급 및 파일 업로드 준비 요청 ****************
  @Post('request-urls')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiGetMediaPresignedUrls()
  async getMediaPresignedUrls(
    @Body() body: GetMediaPresignedUrlReqDto,
    @Req() req: { user: User },
  ): Promise<ResponseDto<GetMediaPresignedUrlResDto>> {
    const ownerId = req.user.id;
    const { message, data } = await this.mediaPipelineService.readyToUpload(
      ownerId,
      body,
    );

    return ResponseDto.success(HttpStatus.ACCEPTED, message, data);
  }

  // **************** Presigned URL 요청 후 업로드 파이프라인 시작 요청 ****************
  @Post('request-processing')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiRequestFileProcessing()
  async requestFileProcessing(
    @Body() dto: RequestFileProcessingReqDto,
    @Req() req: { user: User },
  ): Promise<{ message: string }> {
    const ownerId = req.user.id;
    const { message } = await this.mediaPipelineService.requestFileProcessing(
      ownerId,
      dto,
    );

    return ResponseDto.successWithoutData(HttpStatus.ACCEPTED, message);
  }

  // **************** 영상 파일 multipart 업로드 처리 요청 ****************
  // 1단계: 업로드 시작 (UploadId 발급)
  @Post('initiate-multipart')
  @HttpCode(HttpStatus.ACCEPTED)
  async initiateMultipart(
    @Body() dto: InitiateMultipartUploadReqDto,
  ): Promise<ResponseDto<InitiateMultipartUploadResDto>> {
    const { message, data } =
      await this.mediaPipelineService.initiateMultipart(dto);
    return ResponseDto.success(HttpStatus.ACCEPTED, message, data);
  }

  // 2단계: 조각별 URL 발급 (한꺼번에 여러 개 발급 가능)
  @Get('get-presigned-parts')
  @HttpCode(HttpStatus.ACCEPTED)
  async getPresignedParts(
    @Query() query: GetPresignedPartsReqDto,
  ): Promise<ResponseDto<EachPresignedPartDto[]>> {
    const { message, urls } =
      await this.mediaPipelineService.getPresignedParts(query);
    return ResponseDto.success(HttpStatus.ACCEPTED, message, urls);
  }

  // 3단계: 업로드 완료 (S3에서 조각 병합)
  @Post('complete-multipart')
  @HttpCode(HttpStatus.ACCEPTED)
  async completeMultipart(
    @Body() dto: CompleteMultipartUploadReqDto,
  ): Promise<ResponseDto<{ s3Key: string }>> {
    const { message, s3Key } =
      await this.mediaPipelineService.completeMultipart(dto);
    return ResponseDto.success(HttpStatus.ACCEPTED, message, { s3Key });
  }
}
