import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HttpHealthIndicator,
  HealthCheck,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator, // HTTP 응답 체크용
    private db: TypeOrmHealthIndicator, // DB 연결 상태 체크용
    private memory: MemoryHealthIndicator, // 서버 메모리 사용량 체크용
  ) {}

  @Get()
  @HealthCheck() // Health Check 엔드포인트임을 명시하는 데코레이터
  check() {
    return this.health.check([
      // 1. 데이터베이스 체크
      // 'database'라는 이름으로 현재 TypeORM이 DB와 연결되어 있는지 핑(Ping)을 보냄.
      () => this.db.pingCheck('database'),

      // 2. 서버 응답 체크
      // 서버가 요청을 받을 수 있는 상태인지 본인의 기본 경로로 테스트 요청을 보냄.
      () =>
        this.http.pingCheck(
          'server-api',
          'http://localhost:8001/api/v1/health/ping',
        ),

      // 3. 힙 메모리 체크
      // 서버의 힙 메모리가 150MB를 초과하지 않는지 확인(메모리 누수 감지)
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ]);
  }

  // 위에서 http.pingCheck용으로 사용할 간단한 더미 엔드포인트
  @Get('ping')
  healthPing() {
    return { status: 'ok' };
  }
}
