import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Tag } from './entities/tag.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  // 모든 태그 불러오기
  async findAll(): Promise<{
    message: string;
    tags: Tag[];
  }> {
    const tags = await this.tagRepository.find({
      select: ['id', 'name'],
      order: { name: 'ASC' }, // name 기준으로 정렬하는 것이 클라이언트 UI에 더 편리하다
    });

    return { message: '태그 목록 조회 성공', tags };
  }

  // 태그 이름 목록을 받아 DB에 존재하는 태그 엔티티만 조회
  async findTagsByName(tagNames: string[]): Promise<Tag[]> {
    if (tagNames.length === 0) return [];

    // 중복 제거 및 소문자 처리
    const uniqueNames = [
      ...new Set(tagNames.map((name) => name.toLowerCase().trim())),
    ];

    // DB에서 존재하는 태그만 In 연산자를 사용해 조회
    const existingTags = await this.tagRepository.findBy({
      name: In(uniqueNames),
    });

    // 존재하지 않는 태그는 무시하고, 존재하는 태그 엔티티만 반환
    return existingTags;
  }
}
