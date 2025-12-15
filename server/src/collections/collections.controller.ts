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
import { CreateCollectionDto } from './dto/create-collection.dto';
import { CollectionResponseDto } from './dto/collection-response.dto';
import { ResponseDto } from 'src/common/dto/response.dto';
import { User } from 'src/users/entities/user.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CollectionListResponseDto } from './dto/collection-list-response.dto';
import { CollectionContentsResponseDto } from './dto/collection-contents-response.dto';
import {
  ApiCollectionCreate,
  ApiCollectionDelete,
  ApiGetCollectionContents,
  ApiCollectionList,
  ApiCollectionToggle,
  ApiCollectionUpdate,
} from './decorators/swagger.collections.decorators';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { GetCollectionContentsDto } from './dto/get-collection-contents.dto';

@ApiTags('Collections')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard) // 모든 컬렉션 API는 인증 필수
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  // 사용자 컬렉션 목록 조회
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiCollectionList()
  async getCollections(
    @Req() req: { user: User },
  ): Promise<ResponseDto<CollectionListResponseDto[]>> {
    const userId = req.user.id;
    const { message, collections } =
      await this.collectionsService.findUserCollections(userId);

    return ResponseDto.success(HttpStatus.OK, message, collections);
  }

  // 특정 컬렉션 내의 콘텐츠 내용 조회
  @Get('contents')
  @HttpCode(HttpStatus.OK)
  @ApiGetCollectionContents()
  async getCollectionContents(
    @Query() query: GetCollectionContentsDto,
    @Req() req: { user: User },
  ): Promise<ResponseDto<CollectionContentsResponseDto>> {
    const userId = req.user.id;
    const { message, contents } =
      await this.collectionsService.getCollectionContents(query, userId);

    return ResponseDto.success(HttpStatus.OK, message, contents);
  }

  //새 컬렉션 생성
  // 콘텐츠 id 값 같이 넘겨줄 경우 생성 후 추가까지 처리
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiCollectionCreate()
  async create(
    @Req() req: { user: User },
    @Body() createCollectionDto: CreateCollectionDto,
  ): Promise<ResponseDto<CollectionResponseDto>> {
    const userId = req.user.id;
    const { message, collection } =
      await this.collectionsService.createCollection(
        userId,
        createCollectionDto,
      );

    return ResponseDto.success(HttpStatus.CREATED, message, collection);
  }

  // 컬렉션 이름 수정
  @Patch(':id')
  @ApiCollectionUpdate()
  async updateCollection(
    @Req() req: { user: User },
    @Param('id') collectionId: number,
    @Body() updateCollectionDto: UpdateCollectionDto,
  ): Promise<ResponseDto<CollectionResponseDto>> {
    const { message, collection } =
      await this.collectionsService.updateCollection(
        Number(collectionId),
        req.user.id,
        updateCollectionDto,
      );
    return ResponseDto.success(HttpStatus.OK, message, collection);
  }

  // 컬렉션 삭제
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCollectionDelete()
  async deleteCollection(
    @Req() req: { user: User },
    @Param('id') collectionId: number,
  ): Promise<ResponseDto<null>> {
    const { message } = await this.collectionsService.deleteCollection(
      Number(collectionId),
      req.user.id,
    );

    return ResponseDto.successWithoutData(HttpStatus.NO_CONTENT, message);
  }

  // 미디어 콘텐츠를 특정 컬렉션에 추가/제거
  @Post(':collectionId/media/:mediaId')
  @HttpCode(HttpStatus.OK)
  @ApiCollectionToggle()
  async toggleMediaItem(
    @Req() req: { user: User },
    @Param('collectionId') collectionId: number,
    @Param('mediaId') mediaId: number,
  ): Promise<ResponseDto<{ isAdded: boolean }>> {
    const userId = req.user.id;
    const { message, isAdded } = await this.collectionsService.toggleMediaItem(
      Number(collectionId),
      Number(mediaId),
      userId,
    );

    return ResponseDto.success(HttpStatus.OK, message, { isAdded });
  }

  // 앨범 콘텐츠를 특정 컬렉션에 추가/제거
  @Post(':collectionId/album/:albumId')
  @HttpCode(HttpStatus.OK)
  @ApiCollectionToggle()
  async toggleAlbum(
    @Req() req: { user: User },
    @Param('collectionId') collectionId: number,
    @Param('albumId') albumId: number,
  ): Promise<ResponseDto<{ isAdded: boolean }>> {
    const userId = req.user.id;
    const { message, isAdded } = await this.collectionsService.toggleAlbum(
      Number(collectionId),
      Number(albumId),
      userId,
    );

    return ResponseDto.success(HttpStatus.OK, message, { isAdded });
  }
}
