import {
  Body,
  Controller,
  Delete,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AdminService } from './admin.service';
import { RolesGuard } from 'src/auth/roles.guard';
import { UserRole } from 'src/users/user-role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { DeleteItemDto } from './dto/bulk-delete.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('media-items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAll(@Query('page', ParseIntPipe) page: number = 1) {
    return await this.adminService.findAllWithDeleted(page);
  }

  @Delete('media-items/bulk')
  async deleteMultiple(@Body('items') dto: DeleteItemDto[]) {
    return await this.adminService.bulkHardDelete(dto);
  }
}
