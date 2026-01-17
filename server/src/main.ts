import { NestFactory } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import helmet from 'helmet';
import { winstonLoggerConfig } from './utils/winston.config';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // 요청 데이터 유효성 검사를 위한 ValidationPipe
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // API 문서 자동화를 위한 swagger
import { ConfigService } from '@nestjs/config'; // 환경 변수 관리 모듈
import { HttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonLoggerConfig),
  });
  const configService = app.get(ConfigService);

  (app.getHttpAdapter().getInstance() as any).set('trust proxy', 1); // for deployment
  app.setGlobalPrefix('api/v1'); // 모든 API 경로가 /api/v1/... 로 시작됨
  app.enableCors({
    //origin: process.env.CLIENT_ADDRESS,
    origin: [process.env.CLIENT_ADDRESS, process.env.ADMIN_ADDRESS],
    credentials: true,
    exposedHeaders: ['Authorization'], // 혹시 헤더를 직접 읽어야 할 경우 대비
  });
  app.useGlobalFilters(new HttpExceptionFilter());

  // 애플리케이션 전역에 적용될 글로벌 파이프 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 정의되지 않은 속성은 자동으로 제거
      forbidNonWhitelisted: true, // DTO에 정의되지 않은 속성이 들어오면 400 bad request 에러 발생
      transform: true, // 들어오는 데이터를 DTO 클래스 타입으로 변환
    }),
  );
  app.use(helmet());

  // Swagger 설정을 위한 DocumentBuilder 생성
  const config = new DocumentBuilder()
    .setTitle('SnapHaven API')
    .setDescription('SnapHaven API 명세서')
    .setVersion('v1')
    .addBearerAuth() // JWT 인증을 위한 BearerAuth 추가
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/swagger', app, document); // 'api' 경로에 Swagger UI 생성

  const port = configService.get<number>('SERVER_PORT', 8001);

  app.enableShutdownHooks(); // 정상 종료 훅 활성화
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}/api/v1`); // 실행 중인 URL 로깅
}
bootstrap();
