import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

/**
 * TypeORM CLI(마이그레이션 generate/run/revert) 전용 DataSource.
 * NestJS 런타임 설정(app.module.ts)과 별개로, CLI는 이 파일을 직접 로드한다.
 *
 * 클라우드 비종속: 표준 PostgreSQL 접속 정보만 환경변수로 받는다.
 * (Oracle 등 특정 벤더 기능에 의존하지 않음)
 */
const nodeEnv = process.env.NODE_ENV || 'local';
dotenv.config({ path: path.join(process.cwd(), `.env.${nodeEnv}`) });

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [path.join(__dirname, '/**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '/migrations/*{.ts,.js}')],
  migrationsTableName: 'migrations',
  synchronize: false,
});
