import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/constants/Permission.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TrashService } from './trash.service';
import type { TrashResource } from './trash.service';

@ApiTags('Admin Trash')
@ApiBearerAuth('JWT-auth')
@Controller('admin/trash')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.MANAGE_USERS)
export class TrashController {
  constructor(private readonly trashService: TrashService) {}

  @Get('resources')
  @ApiOperation({ summary: 'List soft-delete resources managed by trash' })
  getResources() {
    return {
      message: 'Trash resources retrieved',
      data: this.trashService.getResources(),
    };
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get deleted item counts by resource' })
  getSummary() {
    return this.trashService.getSummary();
  }

  @Get('product-restore-requests')
  @ApiOperation({ summary: 'List pending product restore requests' })
  getProductRestoreRequests() {
    return this.trashService.getProductRestoreRequests();
  }

  @Patch('product-restore-requests/:requestId/approve')
  @ApiOperation({ summary: 'Approve a product restore request' })
  @ApiParam({ name: 'requestId', type: Number })
  approveProductRestoreRequest(
    @Param('requestId', ParseIntPipe) requestId: number,
    @Req() req: any,
  ) {
    return this.trashService.approveProductRestoreRequest(
      requestId,
      req.user?.userId,
    );
  }

  @Patch('product-restore-requests/:requestId/reject')
  @ApiOperation({ summary: 'Reject a product restore request' })
  @ApiParam({ name: 'requestId', type: Number })
  rejectProductRestoreRequest(
    @Param('requestId', ParseIntPipe) requestId: number,
    @Req() req: any,
  ) {
    return this.trashService.rejectProductRestoreRequest(
      requestId,
      req.user?.userId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List deleted items by resource' })
  @ApiQuery({ name: 'resource', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  findDeleted(
    @Query('resource') resource: TrashResource = 'users',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.trashService.findDeleted({
      resource,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      search,
    });
  }

  @Patch(':resource/:id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted item' })
  @ApiParam({ name: 'resource', type: String })
  @ApiParam({ name: 'id', type: Number })
  restore(
    @Param('resource') resource: TrashResource,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.trashService.restore(resource, id);
  }

  @Delete(':resource/:id/permanent')
  @ApiOperation({ summary: 'Permanently delete a soft-deleted item' })
  @ApiParam({ name: 'resource', type: String })
  @ApiParam({ name: 'id', type: Number })
  permanentlyDelete(
    @Param('resource') resource: TrashResource,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.trashService.permanentlyDelete(resource, id);
  }
}
