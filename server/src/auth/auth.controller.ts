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
  ApiRefreshToken,
  ApiSignin,
  ApiSignout,
  ApiSignUp,
} from './decorators/swagger.decorators';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtRefreshGuard } from './jwt-refresh.guard';
import { User } from 'src/users/entities/user.entity';
import { CheckNicknameDto } from './dto/check-nickname.dto';

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
  ): Promise<ResponseDto<{ access_token: string; refresh_token: string }>> {
    const { access_token, refresh_token, message } =
      await this.authService.signin(signinDto);

    return ResponseDto.success(HttpStatus.OK, message, {
      access_token,
      refresh_token,
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
  ): Promise<ResponseDto<{ access_token: string }>> {
    console.log('refresh controller');
    const user = req.user as User;

    const { access_token, refresh_token, message } =
      await this.authService.refreshTokens(user);

    // Refresh Token 재설정
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'prod',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return ResponseDto.success(HttpStatus.OK, message, { access_token });
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
}
