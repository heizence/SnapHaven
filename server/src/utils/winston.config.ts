import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winstonDaily from 'winston-daily-rotate-file';

const logDir = 'logs'; // 로그 파일이 저장될 디렉토리 이름

const dailyOptions = (level: string) => {
  return {
    level,
    datePattern: 'YYYY-MM-DD',
    dirname: logDir + `/${level}`,
    filename: `%DATE%.${level}.log`,
    maxFiles: 30, // 30일치 로그 저장
    zippedArchive: true, // 로그 파일 압축 여부
  };
};

export const winstonLoggerConfig = {
  transports: [
    // 콘솔 출력 (개발용)
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'silly',
      format: winston.format.combine(
        winston.format.timestamp(),
        nestWinstonModuleUtilities.format.nestLike('SnapHaven', {
          colors: true,
          prettyPrint: true,
        }),
      ),
    }),
    new winstonDaily(dailyOptions('error')), // 에러 로그 파일 저장 (error 레벨만)
    new winstonDaily(dailyOptions('info')), // 모든 로그 파일 저장 (info 레벨 이상)
  ],
};
