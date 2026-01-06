import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Get,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SigninReqDto, SigninResDto } from './dto/signin.dto';
import { SignUpReqDto } from './dto/signup.dto';
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
import { CheckNicknameReqDto } from './dto/check-nickname.dto';
import {
  SendResetPWlinkReqDto,
  SendVerificationCodeReqDto,
} from './dto/send-resetpw-link.dto';
import { ResetPasswordReqDto } from './dto/reset-password.dto';
import { GoogleAuthReqDto } from './dto/google-auth.dto';
import { VerifyCodeReqDto } from './dto/verify-code.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // **************** 로그인 ****************

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiSignin()
  async signin(@Body() dto: SigninReqDto): Promise<ResponseDto<SigninResDto>> {
    const { message, data } = await this.authService.signin(dto);

    return ResponseDto.success(HttpStatus.OK, message, data);
  }

  // **************** 로그아웃 ****************
  @Post('signout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiSignout()
  async signout(@Req() req: { user: User }): Promise<ResponseDto<null>> {
    const user = req.user;
    const serviceRes = await this.authService.signout(user.id);

    return ResponseDto.successWithoutData(HttpStatus.OK, serviceRes.message);
  }

  // **************** 토큰 새로고침 ****************
  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiRefreshToken()
  async refreshTokens(
    @Req() req: { user: User },
  ): Promise<ResponseDto<{ accessToken: string; refreshToken: string }>> {
    const user = req.user;

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
  async signup(@Body() dto: SignUpReqDto): Promise<ResponseDto<null>> {
    const serviceRes = await this.authService.signUp(dto);
    return ResponseDto.successWithoutData(
      HttpStatus.CREATED,
      serviceRes.message,
    );
  }

  // **************** 구글 로그인, 회원가입 ****************
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiGoogleAuth()
  async googleAuth(@Body() dto: GoogleAuthReqDto): Promise<
    ResponseDto<{
      accessToken: string;
      refreshToken: string;
    }>
  > {
    const { message, data } = await this.authService.googleAuth(dto);

    return ResponseDto.success(HttpStatus.OK, message, data);
  }

  // **************** 회원가입 시 인증 코드 발송 요청 ****************
  @Post('email-verification/request')
  @HttpCode(HttpStatus.OK)
  async requestVerification(
    @Body() dto: SendVerificationCodeReqDto,
  ): Promise<ResponseDto<null>> {
    const { message } = await this.authService.sendVerificationCode(dto);
    return ResponseDto.successWithoutData(HttpStatus.OK, message);
  }

  // **************** 회원가입 시 인증 코드 검증 ****************
  @Post('email-verification/verify')
  @HttpCode(HttpStatus.OK)
  verifyCode(@Body() dto: VerifyCodeReqDto): ResponseDto<null> {
    const { message } = this.authService.verifyCode(dto);
    return ResponseDto.successWithoutData(HttpStatus.OK, message);
  }

  // **************** 닉네임 중복 확인 ****************
  @ApiCheckNickname()
  @Get('check-nickname')
  @HttpCode(HttpStatus.OK)
  async checkNickname(
    @Query() dto: CheckNicknameReqDto,
  ): Promise<ResponseDto<null>> {
    const serviceRes = await this.authService.checkNickname(dto);
    return ResponseDto.successWithoutData(HttpStatus.OK, serviceRes.message);
  }

  // **************** 비밀번호 재설정 요청(이메일로 링크 전송) ****************
  @ApiForgotPassword()
  @Post('send-reset-pw-link')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() dto: SendResetPWlinkReqDto,
  ): Promise<ResponseDto<null>> {
    const serviceRes = await this.authService.sendResetPasswordLink(dto);
    return ResponseDto.successWithoutData(HttpStatus.OK, serviceRes.message);
  }

  // **************** 비밀번호 재설정 ****************
  @ApiResetPassword()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: ResetPasswordReqDto,
  ): Promise<ResponseDto<null>> {
    const serviceRes = await this.authService.resetPassword(dto);
    return ResponseDto.successWithoutData(HttpStatus.OK, serviceRes.message);
  }
}
