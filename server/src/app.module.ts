import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import * as Joi from 'joi';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TagsModule } from './tags/tags.module';
import { UploadModule } from './upload/upload.module';
import { MediaItemsModule } from './media-items/media-items.module';
import { CollectionsModule } from './collections/collections.module';
import { BackgroundTaskModules } from './common/background-tasks/background-tasks.module';
import { HealthController } from './health/health.controller';
import { AdminModule } from './admin/admin.module';
import { RedisModule } from './common/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // NODE_ENV 값에 따라 동적으로 .env 파일 경로 설정
      envFilePath: path.join(
        process.cwd(),
        `.env.${process.env.NODE_ENV || 'dev'}`,
      ),

      // 환경 변수 유효성 검사 스키마 추가
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('local', 'dev', 'prod', 'test.dev')
          .default('local'),
        SERVER_PORT: Joi.number().default(8000),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        JWT_SECRET_KEY: Joi.string().required(),
      }),
    }),

    // TypeORM 모듈 비동기 설정
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // TypeORM 설정 내에서 ConfigService 를 사용하기 위해 ConfigModule 을 임포트
      inject: [ConfigService], // useFactory 에 ConfigService 를 주입
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],

        // 테스트 환경일 때는 true. 실행 시마다 데이터 자동 초기화
        // 그 외 환경에서는 false. 엔티티와 DB 스키마 자동 동기화 안 함 (데이터 유실 방지)
        synchronize: false,

        // 실행되는 SQL 쿼리문 로깅하기. 'development' 환경일 때만 logging: true
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          // 테스트 환경(local)일 때는 부하 테스트를 위해 제한을 크게 설정
          ttl: 60000, // 1분
          limit: config.get('NODE_ENV') === 'local' ? 10000 : 100,
        },
      ],
    }),

    EventEmitterModule.forRoot(),
    RedisModule,

    AuthModule,
    UsersModule,
    TagsModule,
    UploadModule,
    MediaItemsModule,
    CollectionsModule,
    BackgroundTaskModules,
    TerminusModule, // Health Check 기능 활성화
    HttpModule, // 내부/외부 HTTP 요청 기능 활성화
    AdminModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // 전역적으로 가드 적용
    },
  ],
})
export class AppModule {}
