import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthProvider, ContentStatus } from 'src/common/enums';
import { GetProfileInfoResDto } from './dto/get-profile-info.dto';
import { MediaItem } from 'src/media-items/entities/media-item.entity';
import { EditProfileReq } from './dto/edit-profile.dto';
import { S3UtilityService } from 'src/media-pipeline/s3-utility.service';
import { DeleteUserReqDto } from './dto/delete-user.dto';
import { Collection } from 'src/collections/entities/collection.entity';
import { RedisService } from 'src/common/redis/redis.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(MediaItem)
    private readonly mediaItemsRepository: Repository<MediaItem>,
    private s3UtilityService: S3UtilityService,
    private redisService: RedisService,
  ) {}

  // 회원가입 (유저 생성)
  async create(user: Partial<User>): Promise<User> {
    const newUser = this.usersRepository.create(user);
    return this.usersRepository.save(newUser);
  }

  // 이메일로 유저 찾기
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  // 유저 찾기 (로그인 시 사용)
  async findByEmailAndProvider(
    email: string,
    provider: AuthProvider,
  ): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email, authProvider: provider },
    });
  }

  // ID로 유저 찾기 (JWT 인증 시 사용)
  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  // 닉네임으로 유저 찾기 (중복 체크 시 사용)
  async findByNickname(nickname: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { nickname } });
  }

  // 유저 정보 업데이트(auth.service 에서 사용)
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`User with ID #${id} not found`);
    }

    // DTO의 내용을 기존 사용자 객체에 병합
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  // 실제 DB 에서 유저 프로필 정보 + 내 좋아요, 내 업로드, 내 컬렉션 정보 불러오기
  private async getProfileInfoFromDb(
    id: number,
  ): Promise<{ message: string; profileInfo: GetProfileInfoResDto }> {
    const userFound = await this.usersRepository.findOne({
      select: [
        'authProvider',
        'nickname',
        'profileImageKey',
        'mediaItems',
        'likedMediaItems',
        'collections',
      ],
      where: { id },
    });

    if (!userFound) {
      throw new NotFoundException(`User with ID #${id} not found`);
    }

    type rawData = {
      user_id: string;
      user_email: string;
      user_password_hash: string;
      user_nickname: string;
      user_profile_image_key: string;
      user_auth_provider: string;
      user_sns_id: string;
      user_created_at: Date;
      user_updated_at: Date;
      user_deleted_at: Date | null;
      user_token_version: number;
      uploadCount: string;
      lastUploadThumbnail: string;
      likeCount: string;
      lastLikeThumbnail: string;
      collectionCount: string;
      lastCollectionThumbnail: string;
    };
    // 2. 내 업로드, 내 좋아요, 내 컬렉션의 통계 및 최근 썸네일 조회
    const qb = this.usersRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id })

      // [내 업로드] 개수 및 최신 썸네일 (일반 사진 or 앨범 대표)
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(m.id)')
          .from(MediaItem, 'm')
          .where('m.ownerId = user.id AND m.status = :active', {
            active: ContentStatus.ACTIVE,
          })
          .andWhere(
            new Brackets((qb) => {
              qb.where('m.albumId IS NULL').orWhere('m.isRepresentative = 1');
            }),
          );
      }, 'uploadCount')
      .addSelect((subQuery) => {
        return subQuery
          .select('m.keyImageSmall')
          .from(MediaItem, 'm')
          .where('m.ownerId = user.id AND m.status = :active')
          .andWhere(
            new Brackets((qb) => {
              qb.where('m.albumId IS NULL').orWhere('m.isRepresentative = 1');
            }),
          )
          .orderBy('m.createdAt', 'DESC')
          .limit(1);
      }, 'lastUploadThumbnail')

      // [내 좋아요] 개수 및 최신 썸네일
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(uml.media_id)')
          .from('user_media_likes', 'uml')
          .innerJoin(MediaItem, 'm', 'm.id = uml.media_id')
          .where('uml.user_id = user.id AND m.status = :active')
          .andWhere(
            new Brackets((qb) => {
              qb.where('m.albumId IS NULL').orWhere('m.isRepresentative = 1');
            }),
          );
      }, 'likeCount')
      .addSelect((subQuery) => {
        return subQuery
          .select('m.keyImageSmall')
          .from('user_media_likes', 'uml')
          .innerJoin(MediaItem, 'm', 'm.id = uml.media_id')
          .where('uml.user_id = user.id AND m.status = :active')
          .andWhere(
            new Brackets((qb) => {
              qb.where('m.albumId IS NULL').orWhere('m.isRepresentative = 1');
            }),
          )
          .orderBy('uml.created_at', 'DESC')
          .limit(1);
      }, 'lastLikeThumbnail')

      // [내 컬렉션] 개수 및 최신 컬렉션의 썸네일
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(c.id)')
          .from(Collection, 'c')
          .where('c.userId = user.id');
      }, 'collectionCount')
      .addSelect((subQuery) => {
        // 가장 최근 수정/생성된 컬렉션의 대표 미디어 썸네일
        return subQuery
          .select('m.keyImageSmall')
          .from(Collection, 'c')
          .innerJoin(
            'collection_media_items',
            'cmi',
            'cmi.collection_id = c.id',
          )
          .innerJoin(MediaItem, 'm', 'm.id = cmi.media_id')
          .where('c.userId = user.id')
          .orderBy('c.createdAt', 'DESC')
          .limit(1);
      }, 'lastCollectionThumbnail');

    const rawResult = (await qb.getRawOne()) as rawData;
    if (!rawResult) {
      throw new NotFoundException('프로필 정보를 조회할 수 없습니다.');
    }

    const uploads = {
      count: parseInt(rawResult.uploadCount, 10) || 0,
      thumbnail: rawResult.lastUploadThumbnail || null,
    };

    const likes = {
      count: parseInt(rawResult.likeCount, 10) || 0,
      thumbnail: rawResult.lastLikeThumbnail || null,
    };

    const collections = {
      count: parseInt(rawResult.collectionCount, 10) || 0,
      thumbnail: rawResult.lastCollectionThumbnail || null,
    };

    return {
      message: '프로필 불러오기 성공',
      profileInfo: { ...userFound, uploads, likes, collections },
    };
  }

  // redis 또는 DB 에서 유저 프로필 및 관련 정보 불러오기
  async getProfileInfo(id: number) {
    return await this.redisService.getOrSetProfile(id, () =>
      this.getProfileInfoFromDb(id),
    );
  }

  // 프로필 정보 수정(서비스에서 사용)
  async editProfile(
    userId: number,
    dto: EditProfileReq,
  ): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'password_hash', 'email', 'nickname'],
    });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const updateData: Partial<User> = {};
    let needsUpdate = false;

    // 닉네임 업데이트 처리
    if (dto.newNickname && dto.newNickname !== user.nickname) {
      const existingUser = await this.usersRepository.findOne({
        where: { nickname: dto.newNickname },
      });
      if (existingUser) {
        throw new ConflictException('이미 사용 중인 닉네임입니다.');
      }
      updateData.nickname = dto.newNickname;
      needsUpdate = true;
    }

    // 필요시에만 비밀번호 변경
    if (dto.currentPassword && dto.newPassword) {
      // 현재 비밀번호 검증
      const isPasswordValid = await bcrypt.compare(
        dto.currentPassword,
        user.password_hash,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('현재 비밀번호가 일치하지 않습니다.');
      }

      // 비밀번호 업데이트 처리
      const isSameAsOld = await bcrypt.compare(
        dto.newPassword,
        user.password_hash,
      );
      if (isSameAsOld) {
        throw new BadRequestException(
          '새 비밀번호는 기존 비밀번호와 달라야 합니다.',
        );
      }

      // 새 비밀번호 해시 처리
      updateData.password_hash = await bcrypt.hash(dto.newPassword, 10);
      needsUpdate = true;
    }

    // 데이터베이스 업데이트 실행
    if (needsUpdate) {
      await this.usersRepository.update(userId, updateData);
      await this.redisService.delProfileCache(userId);
    } else {
      // 변경할 내용이 없는 경우에도 성공으로 응답하지만, 서버 측에서 메시지를 제공하기 위해 명시
      throw new BadRequestException(
        '변경하려는 닉네임이나 비밀번호가 기존과 같거나 누락되었습니다.',
      );
    }

    return {
      message: '프로필이 업데이트 되었습니다.',
    };
  }

  // 프로필 이미지 업데이트
  async editProfileImage(
    userId: number,
    file: Express.Multer.File,
  ): Promise<{ message: string; profileImageKey: string }> {
    if (!file || !file.buffer) {
      throw new BadRequestException('업로드할 파일이 없습니다.');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('이미지 파일만 업로드할 수 있습니다.');
    }

    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['profileImageKey'],
    });

    const oldImageKey = user?.profileImageKey;

    const imageKey = await this.s3UtilityService.uploadProfileImage(
      file.buffer,
      file.mimetype,
      oldImageKey,
    );

    await this.usersRepository.update(
      { id: userId },
      { profileImageKey: imageKey },
    );
    await this.redisService.delProfileCache(userId);

    // 4. 새 이미지 URL 반환
    return {
      message: '프로필 이미지가 변경되었습니다.',
      profileImageKey: imageKey,
    };
  }

  // 사용자 계정 삭제(회원탈퇴)
  async deleteUser(
    userId: number,
    dto: DeleteUserReqDto,
  ): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'password_hash', 'authProvider', 'nickname'],
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 일반 계정의 경우에는 비밀번호 검증 후 삭제, SNS 계정의 경우에는 검증 생략
    if (user.authProvider === AuthProvider.EMAIL) {
      if (!dto.currentPassword) {
        throw new NotFoundException('현재 비밀번호를 입력해 주세요.');
      }

      const isPasswordValid = await bcrypt.compare(
        dto.currentPassword,
        user.password_hash,
      );

      if (!isPasswordValid) {
        throw new NotFoundException('현재 비밀번호가 일치하지 않습니다.');
      }
    }

    await this.usersRepository.softDelete(userId);
    return {
      message: '계정이 삭제되었습니다.',
    };
  }
}
