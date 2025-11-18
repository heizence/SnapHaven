/**
 * Refresh Token 을 받아서 검증을 하기 위한 관문 역할을 하는 파일.
 * jwt-refresh.strategy.ts 를 호출하여 검증을 진행한다.
 * 컨트롤러에서 @UseGuards(JwtRefreshGuard)로 사용된다.
 */
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
// Passport 에 'jwt-refresh' 라는 이름으로 등록된 strategy 를 찾는다.
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
