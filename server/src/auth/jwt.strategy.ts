/**
 * Access Token 추출 및 검증을 위한 파일.
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(
  // jwt-auth.guard.ts 에서 사용할 수 있도록 PassportStrategy 에 'jwt' 라는 이름으로 등록
  Strategy,
  'jwt', // jwt 는 생략 가능
) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      // 토큰을 헤더의 Bearer 토큰에서 추출
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET_KEY')!,
    });
  }

  // 토큰 검증 성공 시 실행되는 validate 함수
  // (여기서 반환된 값은 @UseGuards(JwtAuthGuard)가 적용된 핸들러의 req.user에 저장됨)
  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    if (user.token_version !== payload.token_version) {
      throw new UnauthorizedException('무효화된 토큰입니다.');
    }

    // password_hash 필드는 제외하고 반환
    const { password_hash, ...result } = user;
    return result;
  }
}
