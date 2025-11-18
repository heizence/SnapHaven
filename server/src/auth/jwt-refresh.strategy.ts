/**
 * Refresh Token 추출 및 검증을 위한 파일.
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  // jwt-refresh.guard.ts 에서 사용할 수 있도록 PassportStrategy 에 'jwt-refresh' 라는 이름으로 등록
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET_KEY')!,
      passReqToCallback: true, // validate 함수로 req 객체를 전달
    });
  }

  async validate(req: Request, payload: any) {
    console.log('#validate start');
    const user = await this.usersService.findById(payload.sub);
    console.log('#user : ', user);
    if (!user) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    // 3. [핵심] DB의 토큰 버전과 Refresh Token의 토큰 버전 비교
    if (user.token_version !== payload.token_version) {
      throw new UnauthorizedException('무효화된 토큰입니다.');
    }

    // [신규] 4. req.user에 refresh_token도 함께 저장 (선택 사항)
    const { password_hash, ...result } = user;
    return { ...result, refresh_token: req.cookies['refresh_token'] };
  }
}
