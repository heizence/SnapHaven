import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  Get,
  Patch,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ResponseDto } from 'src/common/dto/response.dto';

import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { ProfileInfoDto } from './dto/profile-info.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ValidationService } from 'src/upload/validation.service';
import { ContentType } from 'src/common/enums';
import { DeleteUserDto } from './dto/delete-user.dto';
import { MediaItemResponseDto } from 'src/media-items/dto/media-item-response.dto';
import { GetMediaItemsDto } from 'src/media-items/dto/get-media-items.dto';
import { MediaItemsService } from 'src/media-items/media-items.service';

@ApiTags('Users')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly mediaItemsService: MediaItemsService,
    private readonly validationService: ValidationService,
  ) {}

  // **************** 프로필 정보(닉네임, 프로필 사진) 불러오기 ****************
  @Get('me/profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '인증된 사용자 프로필 조회',
    description:
      'Access Token을 사용하여 본인의 프로필 상세 정보를 조회합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '프로필 조회 성공',
    type: ResponseDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  async getProfileInfo(
    @Req() req: Request,
  ): Promise<ResponseDto<ProfileInfoDto>> {
    const userId = (req.user as User).id;
    const { message, profileInfo } =
      await this.usersService.getProfileInfo(userId);

    return ResponseDto.success(HttpStatus.ACCEPTED, message, profileInfo);
  }

  // **************** 프로필 닉네임 및 비밀번호 수정 ****************
  @Patch('me/profile')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: '닉네임 및 비밀번호 수정',
    description:
      '현재 비밀번호를 확인한 후 닉네임과 비밀번호를 선택적으로 수정합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '성공적으로 프로필 업데이트',
    type: ResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '입력 데이터 오류 또는 기존 비밀번호 불일치',
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '닉네임 중복' })
  async editProfileInfo(
    @Req() req: Request,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ResponseDto<null>> {
    const userId = (req.user as User).id;

    const { message } = await this.usersService.updateProfile(
      userId,
      updateProfileDto,
    );
    return ResponseDto.successWithoutData(HttpStatus.ACCEPTED, message);
  }

  // **************** 프로필 이미지 수정 ****************
  @Post('me/profile-image')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '프로필 이미지 업데이트',
    description: '이미지 파일을 업로드하고 프로필 URL을 갱신합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '프로필 이미지 업로드 성공',
    type: ResponseDto<{ profileImageKey: string }>,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '파일 유효성 검사 실패',
  })
  async updateProfileImage(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ message: string }> {
    const userId = (req.user as User).id;

    this.validationService.validateFileArray([file], ContentType.IMAGE, 1);
    const { message, profileImageKey } =
      await this.usersService.updateProfileImage(userId, file);

    return ResponseDto.success(HttpStatus.ACCEPTED, message, profileImageKey);
  }

  // **************** 사용자 계정 삭제(회원 탈퇴) ****************
  @Post('me/delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(
    @Req() req: Request,
    @Body() deleteUserDto: DeleteUserDto,
  ): Promise<{ message: string }> {
    const userId = (req.user as User).id;
    const { message } = await this.usersService.deleteUser(
      userId,
      deleteUserDto,
    );
    return ResponseDto.successWithoutData(HttpStatus.NO_CONTENT, message);
  }

  // 내가 업로드한 콘텐츠 목록 조회
  @Get('uploads')
  @ApiOperation({
    summary: '내가 업로드한 콘텐츠 목록 조회',
    description:
      '소유자가 업로드한 모든 미디어/앨범 목록을 관리 목적으로 조회합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '업로드 목록 반환' })
  async getMyUploads(
    @Req() req: { user: User },
    @Query() query: GetMediaItemsDto,
  ): Promise<any> {
    // 반환 타입은 PaginatedMediaItemsDto와 유사
    const userId = req.user.id;
    const { message, items, totalCounts } =
      await this.mediaItemsService.findAll(query, userId, true);
    return ResponseDto.success(HttpStatus.OK, message, {
      items,
      totalCounts,
    });
  }

  // 내가 좋아요 표시한 콘텐츠 목록 조회
  @Get('likes')
  @ApiOperation({
    summary: '내가 좋아요한 콘텐츠 목록 조회',
    description:
      '좋아요를 누른 미디어 및 앨범 목록을 조회하며, 삭제된 항목은 표시됩니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '좋아요 목록 반환',
    type: MediaItemResponseDto,
  })
  async getMyLikedContents(
    @Req() req: { user: User },
    @Query() query: GetMediaItemsDto,
  ): Promise<ResponseDto<MediaItemResponseDto[]>> {
    const userId = req.user.id;
    const { message, likedItems } =
      await this.mediaItemsService.getLikedMediaItems(userId, query);

    return ResponseDto.success(HttpStatus.OK, message, likedItems);
  }
}
