import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Res,
  UseGuards,
  Req,
  Get,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SigninDto } from './dto/signin.dto';
import { SignUpDto } from './dto/signup.dto';
import { ResponseDto } from 'src/common/dto/response.dto';

import {
  ApiCheckNickname,
  ApiForgotPassword,
  ApiGoogleAuth,
  ApiRefreshToken,
  ApiResetPassword,
  ApiSignin,
  ApiSignout,
  ApiSignUp,
} from './decorators/swagger.auth.decorators';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtRefreshGuard } from './jwt-refresh.guard';
import { User } from 'src/users/entities/user.entity';
import { CheckNicknameDto } from './dto/check-nickname.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { SigninResponseDto } from './dto/signin-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // **************** 로그인 ****************

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiSignin()
  async signin(
    @Body() signinDto: SigninDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ResponseDto<SigninResponseDto>> {
    const { message, accessToken, refreshToken, nickname, profileImageKey } =
      await this.authService.signin(signinDto);

    return ResponseDto.success(HttpStatus.OK, message, {
      accessToken,
      refreshToken,
      nickname,
      profileImageKey,
    });
  }

  // **************** 로그아웃 ****************
  @Post('signout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiSignout()
  async signout(
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ResponseDto<null>> {
    const user = req.user as User;
    const serviceRes = await this.authService.signout(user.id);

    return ResponseDto.successWithoutData(HttpStatus.OK, serviceRes.message);
  }

  // **************** 토큰 새로고침 ****************
  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiRefreshToken()
  async refreshTokens(
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ResponseDto<{ accessToken: string; refreshToken: string }>> {
    const user = req.user as User;

    const { accessToken, refreshToken, message } =
      await this.authService.refreshTokens(user);

    // Refresh Token 재설정
    return ResponseDto.success(HttpStatus.OK, message, {
      accessToken,
      refreshToken,
    });
  }

  // **************** 회원가입 ****************
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiSignUp()
  async signup(@Body() signUpDto: SignUpDto): Promise<ResponseDto<null>> {
    const serviceRes = await this.authService.signUp(signUpDto);
    return ResponseDto.successWithoutData(
      HttpStatus.CREATED,
      serviceRes.message,
    );
  }

  // **************** 구글 로그인, 회원가입 ****************
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiGoogleAuth()
  async googleAuth(
    @Body() googleAuthDto: GoogleAuthDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<
    ResponseDto<{
      accessToken: string;
      refreshToken: string;
    }>
  > {
    const { message, accessToken, refreshToken, nickname, profileImageKey } =
      await this.authService.googleAuth(googleAuthDto);

    return ResponseDto.success(HttpStatus.OK, message, {
      accessToken,
      refreshToken,
      nickname,
      profileImageKey,
    });
  }

  // **************** 닉네임 중복 확인 ****************
  @ApiCheckNickname()
  @Get('check-nickname')
  @HttpCode(HttpStatus.OK)
  async checkNickname(
    @Query() checkNicknameDto: CheckNicknameDto,
  ): Promise<ResponseDto<null>> {
    const serviceRes = await this.authService.checkNickname(checkNicknameDto);
    return ResponseDto.successWithoutData(HttpStatus.OK, serviceRes.message);
  }

  // **************** 비밀번호 재설정 요청(이메일로 링크 전송) ****************
  @ApiForgotPassword()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ResponseDto<null>> {
    const serviceRes = await this.authService.forgotPassword(forgotPasswordDto);
    return ResponseDto.successWithoutData(HttpStatus.OK, serviceRes.message);
  }

  // **************** 비밀번호 재설정 ****************
  @ApiResetPassword()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<ResponseDto<null>> {
    const serviceRes = await this.authService.resetPassword(resetPasswordDto);
    return ResponseDto.successWithoutData(HttpStatus.OK, serviceRes.message);
  }
}
