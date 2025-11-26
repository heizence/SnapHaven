import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  InternalServerErrorException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express'; // 다중 파일 인터셉터 사용
import { MediaPipelineService } from 'src/media-pipeline/media-pipeline.service';
import { UploadContentDto } from './dto/upload-content.dto';
import { ContentType } from 'src/common/enums';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import {
  ApiUploadImages,
  ApiUploadVideo,
} from './decorators/swagger.upload.decorators';
import { ValidationService } from './validation.service';
import { ResponseDto } from 'src/common/dto/response.dto';

@ApiTags('Upload')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(
    private readonly validationService: ValidationService,
    private readonly pipelineService: MediaPipelineService,
  ) {}

  // **************** 이미지(단일, 다중 모두 해당) 업로드 ****************
  @Post('images')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FilesInterceptor('files', 100)) // 'files' 필드명으로 전송된 파일 배열을 최대 100개까지 처리
  @ApiUploadImages()
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadContentDto,
    @Req() req: Request,
  ): Promise<ResponseDto<{ mediaIds: number[] }>> {
    console.log('[upload.controller]incoming request : images');
    // 파일 검증 (용량, 갯수)
    this.validationService.validateFileArray(files, ContentType.IMAGE, 10);

    const ownerId = (req.user as any).id;
    console.log('[upload.controller]ownerId : ', ownerId);
    // 파이프라인 서비스 호출 (전체 앨범/묶음 처리)
    const { message, mediaIds } =
      await this.pipelineService.processMultipleUploads(
        ownerId,
        files, // 파일 배열 전달
        body,
        ContentType.IMAGE,
      );

    console.log('[upload.controller]mediaId : ', mediaIds);

    return ResponseDto.success(HttpStatus.ACCEPTED, message, { mediaIds });
  }

  // **************** 비디오 업로드 ****************
  @Post('video')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FilesInterceptor('files', 1)) // 비디오는 단일 파일만 허용
  @ApiUploadVideo()
  async uploadVideo(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadContentDto,
    @Req() req: Request,
  ): Promise<ResponseDto<{ mediaId: number }>> {
    console.log('[upload.controller]incoming request : video');
    if (!files || files.length !== 1) {
      throw new InternalServerErrorException(
        '비디오는 단일 파일만 업로드 가능합니다.',
      );
    }

    // 파일 검증
    this.validationService.validateFileArray(files, ContentType.VIDEO, 1);
    await this.validationService.validateVideoDuration(files[0]);

    const ownerId = (req.user as any).id;
    console.log('[upload.controller]ownerId : ', ownerId);
    // 파이프라인 서비스 호출 (단일 파일)
    const { message, mediaIds } =
      await this.pipelineService.processMultipleUploads(
        ownerId,
        files,
        body,
        ContentType.VIDEO,
      );
    console.log('[upload.controller]mediaIds : ', mediaIds);
    return ResponseDto.success(HttpStatus.ACCEPTED, message, {
      mediaId: mediaIds[0],
    });
  }
}
