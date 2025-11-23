import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { ResponseDto } from 'src/common/dto/response.dto';
import { TagDto } from './dto/tag.dto';
import { ApiGetAllTags } from './decorators/swagger.tags.decorators';

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  // **************** 모든 태그 목록 불러오기 ****************
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiGetAllTags()
  async findAll(): Promise<ResponseDto<TagDto[]>> {
    const { message, tags } = await this.tagsService.findAll();
    return ResponseDto.success(HttpStatus.OK, message, tags);
  }
}
