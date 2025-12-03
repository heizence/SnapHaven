import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthProvider, ContentStatus } from 'src/common/enums';
import { ProfileInfoDto } from './dto/profile-info.dto';
import { MediaItem } from 'src/media-items/entities/media-item.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { S3UtilityService } from 'src/media-pipeline/s3-utility.service';
import { DeleteUserDto } from './dto/delete-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(MediaItem)
    private readonly mediaItemsRepository: Repository<MediaItem>,
    private s3UtilityService: S3UtilityService,
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

  // 유저 프로필 정보 불러오기
  async getProfileInfo(
    id: number,
  ): Promise<{ message: string; profileInfo: ProfileInfoDto }> {
    const userFound = await this.usersRepository.findOne({
      select: [
        'authProvider',
        'nickname',
        'profileImageUrl',
        'mediaItems',
        'likedMediaItems',
        'collections',
      ],
      where: { id },
    });

    if (!userFound) {
      throw new NotFoundException(`User with ID #${id} not found`);
    }

    const mediaItemCount = await this.mediaItemsRepository.count({
      where: {
        ownerId: id,
        status: ContentStatus.ACTIVE,
      },
    });

    return {
      message: '프로필 불러오기 성공',
      profileInfo: { ...userFound, mediaItemCount },
    };
  }

  // 프로필 정보 업데이트(서비스에서 사용)
  async updateProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
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
    if (
      updateProfileDto.newNickname &&
      updateProfileDto.newNickname !== user.nickname
    ) {
      const existingUser = await this.usersRepository.findOne({
        where: { nickname: updateProfileDto.newNickname },
      });
      if (existingUser) {
        throw new ConflictException('이미 사용 중인 닉네임입니다.');
      }
      updateData.nickname = updateProfileDto.newNickname;
      needsUpdate = true;
    }

    // 필요시에만 비밀번호 변경
    if (updateProfileDto.currentPassword && updateProfileDto.newPassword) {
      // 현재 비밀번호 검증
      const isPasswordValid = await bcrypt.compare(
        updateProfileDto.currentPassword,
        user.password_hash,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('현재 비밀번호가 일치하지 않습니다.');
      }

      // 비밀번호 업데이트 처리
      const isSameAsOld = await bcrypt.compare(
        updateProfileDto.newPassword,
        user.password_hash,
      );
      if (isSameAsOld) {
        throw new BadRequestException(
          '새 비밀번호는 기존 비밀번호와 달라야 합니다.',
        );
      }

      // 새 비밀번호 해시 처리
      updateData.password_hash = await bcrypt.hash(
        updateProfileDto.newPassword,
        10,
      );
      needsUpdate = true;
    }

    // 데이터베이스 업데이트 실행
    if (needsUpdate) {
      await this.usersRepository.update(userId, updateData);
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
  async updateProfileImage(
    userId: number,
    file: Express.Multer.File,
  ): Promise<{ message: string; profileImageUrl: string }> {
    if (!file || !file.buffer) {
      throw new BadRequestException('업로드할 파일이 없습니다.');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('이미지 파일만 업로드할 수 있습니다.');
    }

    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['profileImageUrl'],
    });

    const oldImageUrl = user?.profileImageUrl;

    const imageUrl = await this.s3UtilityService.uploadProfileImage(
      file.buffer,
      file.mimetype,
      oldImageUrl,
    );

    await this.usersRepository.update(
      { id: userId },
      { profileImageUrl: imageUrl },
    );

    // 4. 새 이미지 URL 반환
    return {
      message: '프로필 이미지가 변경되었습니다.',
      profileImageUrl: imageUrl,
    };
  }

  // 사용자 계정 삭제(회원탈퇴)
  async deleteUser(
    userId: number,
    deleteUserDto: DeleteUserDto,
  ): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'password_hash', 'authProvider'],
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 일반 계정의 경우에는 비밀번호 검증 후 삭제, SNS 계정의 경우에는 검증 생략
    if (user.authProvider === AuthProvider.EMAIL) {
      if (!deleteUserDto.currentPassword) {
        throw new NotFoundException('현재 비밀번호를 입력해 주세요.');
      }

      const isPasswordValid = await bcrypt.compare(
        deleteUserDto.currentPassword,
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
