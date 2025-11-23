import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

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
}
