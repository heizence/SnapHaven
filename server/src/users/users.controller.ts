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

@ApiTags('Users')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
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
    type: ResponseDto<{ profileImageUrl: string }>,
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
    const { message, profileImageUrl } =
      await this.usersService.updateProfileImage(userId, file);

    return ResponseDto.success(HttpStatus.ACCEPTED, message, profileImageUrl);
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
}
