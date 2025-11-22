import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthProvider } from 'src/common/enums';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
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
      where: { email, auth_provider: provider },
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

  // 유저 정보 업데이트
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`User with ID #${id} not found`);
    }

    // DTO의 내용을 기존 사용자 객체에 병합
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }
}
