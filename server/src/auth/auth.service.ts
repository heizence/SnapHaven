import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service';
import { AuthProvider } from 'src/common/enums';
import { OAuth2Client } from 'google-auth-library';
import { User } from 'src/users/entities/user.entity';

import { SigninDto } from './dto/signin.dto';
import { SignUpDto } from './dto/signup.dto';
import { CheckNicknameDto } from './dto/check-nickname.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { SigninResponseDto } from './dto/signin-response.dto';

interface ServiceResDto {
  message: string;
}

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {
    this.googleClient = new OAuth2Client(
      configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  // 토큰 2개(Access, Refresh)를 생성하는 헬퍼 함수
  private async getTokens(user: User, isRefresh: boolean = false) {
    const tokenPayload = {
      sub: user.id,
      token_version: isRefresh ? user.token_version + 1 : user.token_version,
    };

    const accessToken = await this.jwtService.signAsync(tokenPayload, {
      secret: this.configService.get<string>('JWT_SECRET_KEY')!,
      expiresIn: '15Min',
    });
    const refreshToken = await this.jwtService.signAsync(tokenPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET_KEY')!,
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  // 토큰 새로고침(Refresh)
  async refreshTokens(user: User) {
    // user는 JwtRefreshStrategy.validate()에서 전달받은 값
    // (이 시점에 이미 Refresh Token 검증 및 token_version 검증이 완료됨)
    const tokens = await this.getTokens(user, true);
    await this.usersService.update(user.id, {
      token_version: user.token_version + 1,
    });

    return {
      message: '토큰 갱신 성공',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // 로그인
  async signin(
    signinDto: SigninDto,
  ): Promise<ServiceResDto & SigninResponseDto> {
    const { email, password } = signinDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('이메일 또는 비밀번호를 확인하세요.');
    }

    // 비밀번호 확인 (Bcrypt)
    const isPasswordMatching = await bcrypt.compare(
      password,
      user.password_hash,
    );

    if (!isPasswordMatching) {
      throw new NotFoundException('이메일 또는 비밀번호를 확인하세요.');
    }
    const tokens = await this.getTokens(user);
    return {
      message: '로그인 성공',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      nickname: user.nickname,
      profileImageKey: user.profileImageKey,
    };
  }

  // 로그아웃
  async signout(userId: number): Promise<ServiceResDto> {
    const user = await this.usersService.findById(userId);
    if (user) {
      await this.usersService.update(userId, {
        token_version: user.token_version + 1,
      });
    }
    return { message: '로그아웃 되었습니다.' };
  }

  // 회원가입
  async signUp(signUpDto: SignUpDto): Promise<ServiceResDto> {
    const { email, nickname, password } = signUpDto;

    // 이메일 중복 확인
    const existingEmail = await this.usersService.findByEmailAndProvider(
      email,
      AuthProvider.EMAIL,
    );
    if (existingEmail) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    // 닉네임 중복 확인
    await this.checkNickname({ nickname });

    const password_hash = await bcrypt.hash(password, 10);

    await this.usersService.create({
      email,
      nickname,
      password_hash,
      authProvider: AuthProvider.EMAIL,
    });

    return { message: '회원가입이 완료되었습니다.' };
  }

  // 구글 로그인, 회원가입
  async googleAuth(
    googleAuthDto: GoogleAuthDto,
  ): Promise<ServiceResDto & SigninResponseDto> {
    const { accessToken } = googleAuthDto;

    const response = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new UnauthorizedException(
        '유효하지 않거나 만료된 Google Access Token입니다.',
      );
    }

    const {
      email,
      name: snsName,
      sub: providerId,
      picture, // 프로필 사진 url
    } = await response.json();
    const provider = AuthProvider.GOOGLE;

    const user = await this.usersService.findByEmailAndProvider(
      email,
      provider,
    );
    if (user) {
      const tokens = await this.getTokens(user);

      return {
        message: '구글 로그인 성공',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        nickname: user.nickname,
        profileImageKey: user.profileImageKey,
      };
    }

    // 계정 없음: 자동 회원가입 처리

    const baseNickname = snsName.substring(0, 15);
    const uniqueNickname =
      baseNickname + '#' + Math.floor(Math.random() * 10000); // 닉네임 중복등록 방지를 위해 랜덤 숫자값과 결합

    // 더미 비밀번호 생성 및 해싱
    const dummyPassword =
      Math.random().toString(36).substring(2, 15) + Date.now();
    const password_hash = await bcrypt.hash(dummyPassword, 10);

    // 사용자 생성 (자동 가입)
    const newUser = await this.usersService.create({
      email,
      nickname: uniqueNickname,
      password_hash: password_hash,
      authProvider: provider,
      sns_id: providerId,
    });

    const tokens = await this.getTokens(newUser);

    return {
      message: '구글 로그인 성공',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      nickname: uniqueNickname,
      profileImageKey: null,
    };
  }

  // 닉네임 중복 확인
  async checkNickname(
    checkNicknameDto: CheckNicknameDto,
  ): Promise<ServiceResDto> {
    const existingNickname = await this.usersService.findByNickname(
      checkNicknameDto.nickname,
    );
    if (existingNickname) {
      throw new ConflictException('이미 사용 중인 닉네임입니다.');
    }
    return { message: '사용 가능한 닉네임입니다.' };
  }

  // 비밀번호 재설정 요청(이메일로 재설정 링크만 보내줌. 재설정은 별도로 진행)
  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ServiceResDto> {
    const { email } = forgotPasswordDto;
    const user = await this.usersService.findByEmail(email);
    console.log('email : ', email);
    // 보안: 유저가 존재하지 않아도, 존재 여부를 알려주지 않기 위해 항상 성공처럼 응답한다.(User Enumeration 방지)
    if (!user) {
      console.warn(`[Forgot PW] Non-existent email requested: ${email}`);
      return { message: '이메일이 성공적으로 발송되었습니다.' };
    }

    // 재설정 전용 토큰 생성 (매우 짧은 만료 시간)
    // payload '용도'를 명시하는 것이 좋다.
    const payload = {
      sub: user.id,
      purpose: 'password-reset',
    };
    const resetToken = await this.jwtService.signAsync(payload, {
      expiresIn: '10m',
      secret: this.configService.get<string>('JWT_SECRET_KEY'),
    });

    // 클라이언트의 재설정 페이지 URL
    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;

    try {
      // 이메일 발송
      // 추후 옵션 파라미터 변경
      await this.mailerService.sendMail({
        to: email,
        //to: 'heizence6626@gmail.com', // for test
        from: 'SnapHaven <noreply@snaphaven.com>',
        subject: '[SnapHaven] 비밀번호 재설정 링크입니다.',
        html: `
        <p>비밀번호를 재설정하려면 아래 링크를 클릭하세요 (10분 내 만료):</p>
        <a href="${resetUrl}" target="_blank">비밀번호 재설정하기</a>
      `,
      });
    } catch (error) {
      // 이메일 전송 실패(e.g., 존재하지 않는 도메인) 시 에러를 로깅하되, 500 에러를 반환하지 않고 조용히 종료
      console.error(`[Forgot PW] Failed to send email to ${email}`, error);
    }

    return { message: '이메일이 성공적으로 발송되었습니다.' };
  }

  // 비밀번호 재설정
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<ServiceResDto> {
    const { token, newPassword } = resetPasswordDto;

    let payload: { sub: number; purpose: string };

    // 토큰 검증
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET_KEY'),
      });
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('유효하지 않거나 만료된 토큰입니다.');
    }

    // 토큰 용도 확인 (Access/Refresh 토큰 재사용 방지)
    if (payload.purpose !== 'password-reset') {
      throw new UnauthorizedException('잘못된 용도의 토큰입니다.');
    }

    // 유저 존재 확인
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 새 비밀번호 해싱
    const password_hash = await bcrypt.hash(newPassword, 10);

    // 보안: 비밀번호 변경 시, 모든 기기 로그아웃 (토큰 버전 증가)
    await this.usersService.update(user.id, {
      password_hash: password_hash,
      token_version: user.token_version + 1,
    });

    return { message: '비밀번호가 성공적으로 변경되었습니다.' };
  }
}
