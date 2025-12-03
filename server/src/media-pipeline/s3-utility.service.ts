import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
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
   * S3에 파일 직접 업로드를 위한 Presigned PUT URL을 생성
   * @param key S3에 저장될 최종 키 (ex: media_items/uuid.jpg)
   * @param contentType 파일의 MIME 타입 (클라이언트 PUT 요청의 Content-Type과 일치해야 함)
   * @param contentLength 파일의 바이트 크기 (클라이언트 PUT 요청의 Content-Length와 일치해야 함)
   * @returns 10분 동안 유효한 Presigned URL
   */
  async getPresignedPutUrl(
    key: string,
    contentType: string,
    contentLength: number,
  ): Promise<string> {
    const expiresIn = 600; // 10분 유효

    const command = new PutObjectCommand({
      Bucket: this.ORIGINALS_BUCKET,
      Key: key,
      ContentType: contentType,
      // [CRITICAL] 클라이언트가 PUT 요청 시 해당 크기와 타입으로만 업로드 허용하도록 제한
      ContentLength: contentLength,
    });

    try {
      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresIn,
      });
      return signedUrl;
    } catch (error) {
      console.error('Presigned URL 생성 오류:', error);
      throw new InternalServerErrorException(
        'Presigned URL 생성 중 문제가 발생했습니다.',
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
      const command = new GetObjectCommand({
        Bucket: this.ORIGINALS_BUCKET,
        Key: s3Key,
      });
      const { Body } = await this.s3Client.send(command);

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
   * @returns S3 key
   */
  async uploadProcessedFile(
    localSourcePath: string,
    targetKey: string,
    contentType: string,
  ): Promise<string> {
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

      return targetKey;
    } catch (error) {
      this.handleS3Error('uploadProcessedFile', error);
      throw new InternalServerErrorException('Public S3 처리 파일 업로드 실패');
    }
  }

  /**
   * S3 Public 에 프로필 사진 업로드
   * @param fileBuffer 업로드할 파일의 Buffer
   * @param mimeType 파일의 MIME 타입 (예: 'image/jpeg')
   * @param userId 사용자 ID (S3 Key 구성에 사용)
   * @returns S3 Key
   */
  async uploadProfileImage(
    fileBuffer: Buffer,
    mimeType: string,
    oldImageKey?: string | null,
  ): Promise<string> {
    const fileExtension = mimeType.split('/')[1] || 'jpeg';
    const key = `profiles/${uuidv4()}.${fileExtension}`;
    const putCommand = new PutObjectCommand({
      Bucket: this.ASSETS_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    try {
      await this.s3Client.send(putCommand);

      // 기존 프로필 이미지는 삭제해 주기
      if (oldImageKey) {
        const oldKey = oldImageKey;
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.ASSETS_BUCKET,
            Key: oldKey,
          }),
        );
      }
      return key;
    } catch (error) {
      console.error('S3 프로필 이미지 업로드 실패:', error);
      throw new InternalServerErrorException(
        '프로필 이미지 업로드 중 오류가 발생했습니다.',
      );
    }
  }

  /**
   * [DELETE] S3에서 객체를 삭제합니다. (롤백, 소프트 삭제 관리용)
   */
  async deleteObject(
    bucket: 'originals' | 'assets',
    key: string,
  ): Promise<void> {
    const Bucket =
      bucket === 'originals' ? this.ORIGINALS_BUCKET : this.ASSETS_BUCKET;

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
