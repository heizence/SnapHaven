import { PartialType } from '@nestjs/swagger';
import { CreateCollectionDto } from './create-collection.dto'; // 기존 생성 DTO 참조

export class UpdateCollectionDto extends PartialType(CreateCollectionDto) {}
