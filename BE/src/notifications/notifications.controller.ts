import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import {
  NotificationResponse,
  NotificationStatsResponse,
  PaginatedNotificationsResponse,
} from './interfaces/notification.interface';

@Controller('notifications')
@UseGuards(JwtAuthGuard) // ✅ Require JWT for all endpoints
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createNotificationDto: CreateNotificationDto,
    @Request() req: any,
  ): Promise<NotificationResponse> {
    const userId = req.user?.sub || req.user?.userId;
    return this.notificationsService.createForUser(
      userId,
      createNotificationDto,
    );
  }

  @Get()
  async findAll(
    @Query() queryDto: QueryNotificationsDto & { userId?: string },
    @Request() req: any,
  ): Promise<PaginatedNotificationsResponse> {
    // ✅ Use userId from query param if provided, otherwise from JWT
    const jwtUserId = req.user?.sub || req.user?.userId;
    const targetUserId = queryDto.userId
      ? parseInt(queryDto.userId, 10)
      : jwtUserId;
    return this.notificationsService.findAllForUser(targetUserId, queryDto);
  }

  @Get('stats')
  async getStats(
    @Request() req: any,
    @Query('userId') userId?: string,
  ): Promise<NotificationStatsResponse> {
    // ✅ Use userId from query if provided, otherwise from JWT
    const jwtUserId = req.user?.sub || req.user?.userId;
    const targetUserId = userId ? parseInt(userId, 10) : jwtUserId;
    return this.notificationsService.getStats(targetUserId);
  }

  @Post('mark-all-read')
  async markAllAsRead(
    @Body() body: { user_id?: string | number },
    @Request() req: any,
  ): Promise<{ updated: number }> {
    // ✅ Use user_id from body if provided, otherwise from JWT
    const jwtUserId = req.user?.sub || req.user?.userId;
    const targetUserId = body.user_id
      ? typeof body.user_id === 'string'
        ? parseInt(body.user_id, 10)
        : body.user_id
      : jwtUserId;
    return this.notificationsService.markAllAsRead(targetUserId);
  }

  @Delete('read')
  async deleteAllRead(
    @Body() body: { user_id?: string | number },
    @Request() req: any,
  ): Promise<{ deleted: number }> {
    // ✅ Use user_id from body if provided, otherwise from JWT
    const jwtUserId = req.user?.sub || req.user?.userId;
    const targetUserId = body.user_id
      ? typeof body.user_id === 'string'
        ? parseInt(body.user_id, 10)
        : body.user_id
      : jwtUserId;
    return this.notificationsService.deleteAllRead(targetUserId);
  }

  // ✅ Route cụ thể phải đặt TRƯỚC route generic :id
  @Get(':userId/unread-count')
  async getUnreadCount(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<{ success: boolean; count: number }> {
    const stats = await this.notificationsService.getStats(userId);
    return {
      success: true,
      count: stats.unread,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<NotificationResponse> {
    const userId = req.user?.sub || req.user?.userId;
    return this.notificationsService.findOne(id, userId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @Request() req: any,
  ): Promise<NotificationResponse> {
    const userId = req.user?.sub || req.user?.userId;
    return this.notificationsService.update(id, userId, updateNotificationDto);
  }

  @Patch(':id/mark-read')
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { user_id?: string | number },
    @Request() req: any,
  ): Promise<NotificationResponse> {
    // ✅ Use user_id from body if provided, otherwise from JWT
    const jwtUserId = req.user?.sub || req.user?.userId;
    const targetUserId = body.user_id
      ? typeof body.user_id === 'string'
        ? parseInt(body.user_id, 10)
        : body.user_id
      : jwtUserId;
    return this.notificationsService.markAsRead(id, targetUserId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<void> {
    const userId = req.user?.sub || req.user?.userId;
    return this.notificationsService.remove(id, userId);
  }

  // Test endpoint to create sample notifications
  @Post('test/create-samples/:userId')
  async createSampleNotifications(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<{ success: boolean; message: string; created: number }> {
    const sampleNotifications = [
      {
        type: 'order_status',
        title: 'Đơn hàng đã được xác nhận',
        body: 'Đơn hàng #12345 của bạn đã được xác nhận và đang được chuẩn bị',
        meta_json: {
          order_id: 1,
          order_status: 'confirmed',
        },
      },
      {
        type: 'new_review',
        title: 'Có đánh giá mới cho sản phẩm của bạn',
        body: 'Khách hàng đã đánh giá 5 sao cho sản phẩm "Serum Vitamin C"',
        meta_json: {
          product_id: 1,
          product_name: 'Serum Vitamin C',
          rating: 5,
          reviewer_name: 'Linh Beauty Expert',
        },
      },
      {
        type: 'order_delivered',
        title: 'Đơn hàng đã giao thành công',
        body: 'Đơn hàng #12346 đã được giao thành công. Hãy đánh giá sản phẩm nhé!',
        meta_json: {
          order_id: 2,
          order_status: 'delivered',
        },
      },
      {
        type: 'promotion',
        title: 'Ưu đãi đặc biệt dành cho bạn',
        body: 'Giảm 20% cho tất cả sản phẩm chăm sóc da trong tuần này!',
        meta_json: {
          coupon_code: 'SKINCARE20',
          discount_percent: 20,
        },
      },
    ];

    let created = 0;
    for (const notification of sampleNotifications) {
      try {
        await this.notificationsService.createForUser(userId, notification);
        created++;
      } catch (error) {
        console.error('Error creating sample notification:', error);
      }
    }

    return {
      success: true,
      message: `Created ${created} sample notifications for user ${userId}`,
      created,
    };
  }
}
