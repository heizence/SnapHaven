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
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ResponseDto } from 'src/common/dto/response.dto';

import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { GetProfileInfoResDto } from './dto/get-profile-info.dto';
import { EditProfileReq } from './dto/edit-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ValidationService } from 'src/upload/validation.service';
import { ContentType } from 'src/common/enums';
import { DeleteUserReqDto } from './dto/delete-user.dto';
import {
  GetMediaItemsReqDto,
  GetMediaItemsResDto,
} from 'src/media-items/dto/get-media-items.dto';
import { MediaItemsService } from 'src/media-items/media-items.service';
import {
  ApiDeleteUser,
  ApiEditProfileImage,
  ApiEditProfileInfo,
  ApiGetMyLikedContents,
  ApiGetMyUploads,
  ApiGetProfileInfo,
} from './decorators/swagger.users.decorators';

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
  @ApiGetProfileInfo()
  async getProfileInfo(
    @Req() req: Request,
  ): Promise<ResponseDto<GetProfileInfoResDto>> {
    const userId = (req.user as User).id;
    const { message, profileInfo } =
      await this.usersService.getProfileInfo(userId);

    return ResponseDto.success(HttpStatus.ACCEPTED, message, profileInfo);
  }

  // **************** 프로필 닉네임 및 비밀번호 수정 ****************
  @Patch('me/profile')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiEditProfileInfo()
  async editProfileInfo(
    @Req() req: Request,
    @Body() dto: EditProfileReq,
  ): Promise<ResponseDto<null>> {
    const userId = (req.user as User).id;

    const { message } = await this.usersService.editProfile(userId, dto);
    return ResponseDto.successWithoutData(HttpStatus.ACCEPTED, message);
  }

  // **************** 프로필 이미지 수정 ****************
  @Post('me/profile-image')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiConsumes('multipart/form-data')
  @ApiEditProfileImage()
  async editProfileImage(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ message: string }> {
    const userId = (req.user as User).id;

    this.validationService.validateFileArray([file], ContentType.IMAGE, 1);
    const { message, profileImageKey } =
      await this.usersService.editProfileImage(userId, file);

    return ResponseDto.success(HttpStatus.ACCEPTED, message, profileImageKey);
  }

  // **************** 사용자 계정 삭제(회원 탈퇴) ****************
  @Post('me/delete')
  @HttpCode(HttpStatus.OK)
  @ApiDeleteUser()
  async deleteUser(
    @Req() req: Request,
    @Body() dto: DeleteUserReqDto,
  ): Promise<{ message: string }> {
    const userId = (req.user as User).id;
    const { message } = await this.usersService.deleteUser(userId, dto);
    return ResponseDto.successWithoutData(HttpStatus.OK, message);
  }

  // **************** 내가 업로드한 콘텐츠 목록 조회 ****************
  @Get('uploads')
  @ApiGetMyUploads()
  async getMyUploads(
    @Req() req: { user: User },
    @Query() query: GetMediaItemsReqDto,
  ): Promise<ResponseDto<GetMediaItemsResDto>> {
    // 반환 타입은 GetMediaItemsResDto와 유사
    const userId = req.user.id;
    const { message, items, totalCounts } =
      await this.mediaItemsService.findAll(query, userId, true);
    return ResponseDto.success(HttpStatus.OK, message, {
      items,
      totalCounts,
    });
  }

  // **************** 내가 좋아요 표시한 콘텐츠 목록 조회 ****************
  @Get('likes')
  @ApiGetMyLikedContents()
  async getMyLikedContents(
    @Req() req: { user: User },
    @Query() query: GetMediaItemsReqDto,
  ): Promise<ResponseDto<GetMediaItemsResDto>> {
    const userId = req.user.id;
    const { message, items } = await this.mediaItemsService.getLikedMediaItems(
      userId,
      query,
    );

    return ResponseDto.success(HttpStatus.OK, message, { items });
  }
}
