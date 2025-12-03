import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MediaItem } from 'src/media-items/entities/media-item.entity';
import { S3UtilityService } from 'src/media-pipeline/s3-utility.service';
import { ValidationService } from 'src/upload/validation.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, MediaItem])],
  controllers: [UsersController],
  providers: [UsersService, S3UtilityService, ValidationService],
  exports: [UsersService],
})
export class UsersModule {}
