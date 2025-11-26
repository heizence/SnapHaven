import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

@Injectable()
export class S3UtilityService {
  private s3Client: S3Client;
  private ORIGINALS_BUCKET: string;
  private ASSETS_BUCKET: string;
  private AWS_REGION: string;
  private CDN_BASE_URL: string;

  constructor(private configService: ConfigService) {
    this.AWS_REGION = this.configService.get('AWS_REGION')!;
    this.ORIGINALS_BUCKET = this.configService.get('AWS_S3_ORIGINALS_BUCKET')!;
    this.ASSETS_BUCKET = this.configService.get('AWS_S3_ASSETS_BUCKET')!;

    // Public 버킷 URL 구조 설정
    this.CDN_BASE_URL = `https://${this.ASSETS_BUCKET}.s3.${this.AWS_REGION}.amazonaws.com`;

    // S3 Client 초기화 (IAM Role을 통해 자동 권한 획득 가정)
    this.s3Client = new S3Client({
      region: this.AWS_REGION,
    });
  }

  /**
   * [WRITE] Private S3에 원본 파일을 업로드 (UploadController의 동기적 S3 저장)
   * @param key 파일 키 (DB에 저장될 경로)
   * @param body 파일 내용 (Buffer, Stream 등)
   * @param contentType MIME 타입
   * @returns 파일 키 (s3KeyOriginal)
   * ! will be deprecated soon.
   */
  async uploadOriginal(
    key: string,
    body: Buffer | Readable | Blob,
    contentType: string,
  ): Promise<string> {
    try {
      console.log('[s3-utility.service]uploadOriginal start.');
      console.log('[s3-utility.service]key : ', key);
      console.log('[s3-utility.service]body : ', body);
      console.log('[s3-utility.service]contentType : ', contentType);
      const command = new PutObjectCommand({
        Bucket: this.ORIGINALS_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      });
      await this.s3Client.send(command);
      return key;
    } catch (error) {
      this.handleS3Error('uploadOriginal', error);
      throw new InternalServerErrorException(
        'Private S3 원본 파일 업로드 실패',
      );
    }
  }

  /**
   * [READ] Private S3에서 파일을 로컬 경로로 다운로드 (파이프라인 워커 사용)
   * @param s3Key Private S3에 저장된 원본 파일 키
   * @param localTargetPath EC2 임시 경로
   */
  async downloadOriginal(
    s3Key: string,
    localTargetPath: string,
  ): Promise<void> {
    try {
      console.log('[s3-utility.service]downloadoriginal start.');
      console.log('[s3-utility.service]s3Key : ', s3Key);
      console.log('[s3-utility.service]localTargetPath : ', localTargetPath);

      const command = new GetObjectCommand({
        Bucket: this.ORIGINALS_BUCKET,
        Key: s3Key,
      });
      const { Body } = await this.s3Client.send(command);

      console.log('[s3-utility.service]Body : ', Body);
      if (Body instanceof Readable) {
        // 스트림 파이프라인을 사용하여 메모리 효율적으로 로컬 파일에 저장
        await pipeline(Body, fs.createWriteStream(localTargetPath));
      } else {
        throw new Error('S3 응답 바디가 유효한 스트림 형식이 아닙니다.');
      }
    } catch (error) {
      this.handleS3Error('downloadOriginal', error);
      throw new InternalServerErrorException(
        'Private S3 원본 파일 다운로드 실패',
      );
    }
  }

  /**
   * [WRITE] Public S3에 처리된 파일(썸네일, 리사이징 등)을 업로드 (파이프라인 워커 사용)
   * @param localSourcePath EC2 임시 경로
   * @param targetKey Public S3에 저장될 최종 키 (파일 이름/경로)
   * @param contentType MIME 타입
   * @returns Public Access URL (FR-SYS-006)
   */
  async uploadProcessedFile(
    localSourcePath: string,
    targetKey: string,
    contentType: string,
  ): Promise<string> {
    console.log('[s3-utility.service]uploadProcessedFile start.');
    console.log('[s3-utility.service]localSourcePath : ', localSourcePath);
    console.log('[s3-utility.service]targetKey : ', targetKey);
    console.log('[s3-utility.service]contentType : ', contentType);
    try {
      // fs.promises의 open을 사용해 파일 디스크립터를 얻습니다.
      const fileHandle = await fsPromises.open(localSourcePath, 'r');
      const command = new PutObjectCommand({
        Bucket: this.ASSETS_BUCKET,
        Key: targetKey,
        Body: fileHandle.createReadStream(),
        ContentType: contentType,
      });
      await this.s3Client.send(command);
      await fileHandle.close(); // 파일 핸들 닫기
      console.log(
        '[s3-utility.service]public URL : ',
        `${this.CDN_BASE_URL}/${targetKey}`,
      );
      // Public URL 반환
      return `${this.CDN_BASE_URL}/${targetKey}`;
    } catch (error) {
      this.handleS3Error('uploadProcessedFile', error);
      throw new InternalServerErrorException('Public S3 처리 파일 업로드 실패');
    }
  }

  /**
   * [DELETE] S3에서 객체를 삭제합니다. (롤백, 소프트 삭제 관리용)
   */
  async deleteObject(
    bucket: 'originals' | 'assets',
    key: string,
  ): Promise<void> {
    console.log('[s3-utility.service]deleteObject start.');
    console.log('[s3-utility.service]bucket : ', bucket);
    console.log('[s3-utility.service]key : ', key);
    const Bucket =
      bucket === 'originals' ? this.ORIGINALS_BUCKET : this.ASSETS_BUCKET;

    console.log('[s3-utility.service]Bucket : ', Bucket);
    try {
      const command = new DeleteObjectCommand({
        Bucket,
        Key: key,
      });
      await this.s3Client.send(command);
    } catch (error) {
      this.handleS3Error('deleteObject', error);
      throw new InternalServerErrorException(`S3 객체 삭제 실패 (${key})`);
    }
  }

  private handleS3Error(method: string, error: any) {
    console.error(
      `[S3 Utility Service - ${method}] Error: ${error.message}`,
      error,
    );
  }
}
