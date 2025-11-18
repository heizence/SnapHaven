import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SigninDto } from './dto/signin.dto';
import { AuthProvider } from 'src/common/enums';
import { SignUpDto } from './dto/signup.dto';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/users/entities/user.entity';
import { CheckNicknameDto } from './dto/check-nickname.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // 토큰 2개(Access, Refresh)를 생성하는 헬퍼 함수
  async getTokens(user: User) {
    const accessPayload = {
      sub: user.id,
      email: user.email,
      nickname: user.nickname,
    };

    const refreshPayload = {
      sub: user.id,
      token_version: user.token_version, // 로그아웃 시 무효화를 위함
    };

    const accessToken = await this.jwtService.signAsync(accessPayload);
    const refreshToken = await this.jwtService.signAsync(refreshPayload);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  // 토큰 새로고침(Refresh)
  async refreshTokens(user: User) {
    // user는 JwtRefreshStrategy.validate()에서 전달받은 값
    // (이 시점에 이미 Refresh Token 검증 및 token_version 검증이 완료됨)

    const tokens = await this.getTokens(user);
    console.log('#tokens : ', tokens);
    await this.usersService.update(user.id, {
      token_version: user.token_version + 1,
    });

    return {
      message: '토큰 갱신 성공',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    };
  }

  // 로그인
  async signin(
    signinDto: SigninDto,
  ): Promise<{ message: string; access_token: string; refresh_token: string }> {
    const { email, password } = signinDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('이메일 또는 비밀번호를 확인하세요.');
    }
    console.log('#user : ', user);
    // 비밀번호 확인 (Bcrypt)
    const isPasswordMatching = await bcrypt.compare(
      password,
      user.password_hash,
    );

    if (!isPasswordMatching) {
      throw new NotFoundException('이메일 또는 비밀번호를 확인하세요.');
    }
    console.log('#isPasswordMatching : ', isPasswordMatching);
    const tokens = await this.getTokens(user);
    console.log('#tokens : ', tokens);
    return {
      message: '로그인 성공',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token, // 컨트롤러가 이 토큰을 쿠키에 담음
    };
  }

  // 로그아웃
  async signout(userId: number): Promise<{ message: string }> {
    const user = await this.usersService.findById(userId);
    if (user) {
      await this.usersService.update(userId, {
        token_version: user.token_version + 1,
      });
    }
    return { message: '로그아웃 되었습니다.' };
  }

  // 회원가입
  async signUp(signUpDto: SignUpDto): Promise<{ message: string }> {
    const { email, nickname, password } = signUpDto;

    // 이메일 중복 확인
    const existingEmail = await this.usersService.findByEmail(email);
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
      auth_provider: AuthProvider.EMAIL,
    });

    return { message: '회원가입이 완료되었습니다.' };
  }

  // 닉네임 중복 확인
  async checkNickname(
    checkNicknameDto: CheckNicknameDto,
  ): Promise<{ message: string }> {
    const existingNickname = await this.usersService.findByNickname(
      checkNicknameDto.nickname,
    );
    if (existingNickname) {
      throw new ConflictException('이미 사용 중인 닉네임입니다.');
    }
    return { message: '사용 가능한 닉네임입니다.' };
  }
}
