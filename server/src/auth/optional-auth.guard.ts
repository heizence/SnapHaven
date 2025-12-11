import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  /**
   * JWT Strategy의 처리 결과를 받아 요청을 통과시킬지 결정
   * @param err - JWT 검증 중 발생한 에러 (심각한 시스템 에러)
   * @param user - JwtStrategy.validate()가 반환한 사용자 정보 (성공 시 유저 객체, 실패 시 null/false)
   * @param info - Passport가 제공하는 추가 정보 (예: 토큰 만료 에러 등)
   */
  handleRequest(err, user, info, context: ExecutionContext) {
    //console.log('[optional-auth.guard]user : ', user);
    // 1. 심각한 시스템 에러가 발생한 경우, 그대로 에러를 발생시킨다.
    if (err) {
      throw err;
    }

    // 2. 토큰이 존재하지만 만료되었거나 유효하지 않은 경우 (user가 null 또는 false)
    // 일반적으로 AuthGuard는 여기서 UnauthorizedException을 던지지만,
    // Optional Guard는 에러를 던지지 않고 user 객체(null/undefined)를 반환하여 요청을 통과시킨다.

    // 3. 인증 성공 시, user 객체가 반환되어 req.user에 할당됩니다.

    // 핵심: user가 null이거나 false이더라도 요청을 통과시키기 위해
    // 예외를 발생시키지 않고, 그대로 user 객체(null 또는 유저 정보)를 반환
    return user;
  }
}
