import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Param,
  Get,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CollectionsService } from './collections.service';
import {
  CreateCollectionReqDto,
  CreateCollectionResDto,
} from './dto/create-collection.dto';
import { ResponseDto } from 'src/common/dto/response.dto';
import { User } from 'src/users/entities/user.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CollectionDto } from './dto/get-collections.dto';
import {
  ApiCollectionCreate,
  ApiCollectionDelete,
  ApiGetCollectionContents,
  ApiCollectionList,
  ApiCollectionToggle,
  ApiCollectionEdit,
} from './decorators/swagger.collections.decorators';
import {
  EditCollectionReqDto,
  EditCollectionResDto,
} from './dto/edit-collection.dto';
import {
  GetCollectionContentsReqDto,
  GetCollectionContentsResDto,
} from './dto/get-collection-contents.dto';
import { DeleteCollectionResDto } from './dto/delete-collection.dto';
import { ToggleMediaItemResDto } from './dto/toggle-media-item.dto';

@ApiTags('Collections')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard) // 모든 컬렉션 API는 인증 필수
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  // **************** 사용자 컬렉션 목록 조회 ****************
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiCollectionList()
  async getMyCollections(
    @Req() req: { user: User },
    @Query() query: { mediaId: number },
  ): Promise<ResponseDto<CollectionDto[]>> {
    const userId = req.user.id;
    const mediaId = query.mediaId || undefined;
    const { message, collections } =
      await this.collectionsService.getMyCollections(userId, mediaId);

    return ResponseDto.success(HttpStatus.OK, message, collections);
  }

  // **************** 특정 컬렉션 내의 콘텐츠 내용 조회 ****************
  @Get('contents')
  @HttpCode(HttpStatus.OK)
  @ApiGetCollectionContents()
  async getCollectionContents(
    @Query() query: GetCollectionContentsReqDto,
    @Req() req: { user: User },
  ): Promise<ResponseDto<GetCollectionContentsResDto>> {
    const userId = req.user.id;
    const { message, contents } =
      await this.collectionsService.getCollectionContents(query, userId);

    return ResponseDto.success(HttpStatus.OK, message, contents);
  }

  // **************** 새 컬렉션 생성 ****************
  // 콘텐츠 id 값 같이 넘겨줄 경우 생성 후 추가까지 처리
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiCollectionCreate()
  async create(
    @Req() req: { user: User },
    @Body() dto: CreateCollectionReqDto,
  ): Promise<ResponseDto<CreateCollectionResDto>> {
    const userId = req.user.id;
    const { message, collection } =
      await this.collectionsService.createCollection(userId, dto);

    return ResponseDto.success(HttpStatus.CREATED, message, collection);
  }

  // **************** 컬렉션 이름 수정 ****************
  @Patch(':collectionId')
  @ApiCollectionEdit()
  async editCollection(
    @Req() req: { user: User },
    @Param('collectionId') collectionId: number,
    @Body() dto: EditCollectionReqDto,
  ): Promise<ResponseDto<EditCollectionResDto>> {
    const { message, collection } =
      await this.collectionsService.editCollection(
        Number(collectionId),
        req.user.id,
        dto,
      );
    return ResponseDto.success(HttpStatus.OK, message, collection);
  }

  // **************** 컬렉션 삭제 ****************
  @Delete(':id')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiCollectionDelete()
  async deleteCollection(
    @Req() req: { user: User },
    @Param('id') collectionId: number,
  ): Promise<ResponseDto<DeleteCollectionResDto>> {
    const { message, deletedCollectionId } =
      await this.collectionsService.deleteCollection(
        Number(collectionId),
        req.user.id,
      );

    return ResponseDto.success(HttpStatus.ACCEPTED, message, {
      deletedCollectionId,
    });
  }

  // **************** 미디어 콘텐츠를 특정 컬렉션에 추가/제거 ****************
  @Post(':collectionId/media/:mediaId')
  @HttpCode(HttpStatus.OK)
  @ApiCollectionToggle()
  async toggleMediaItem(
    @Req() req: { user: User },
    @Param('collectionId') collectionId: number,
    @Param('mediaId') mediaId: number,
  ): Promise<ResponseDto<ToggleMediaItemResDto>> {
    const userId = req.user.id;
    const { message, isAdded } = await this.collectionsService.toggleMediaItem(
      Number(collectionId),
      Number(mediaId),
      userId,
    );

    return ResponseDto.success(HttpStatus.OK, message, { isAdded });
  }
}
