import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/constants/Permission.enum';

@ApiTags('api-logs')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.MANAGE_USERS)
@Controller('api-logs')
export class ApiLogsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách API logs (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiQuery({ name: 'method', required: false, type: String, example: 'GET' })
  @ApiQuery({
    name: 'status_code',
    required: false,
    type: Number,
    example: 200,
  })
  @ApiQuery({ name: 'user_id', required: false, type: Number })
  @ApiQuery({ name: 'path', required: false, type: String })
  async getLogs(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('method') method?: string,
    @Query('status_code') statusCode?: number,
    @Query('user_id') userId?: number,
    @Query('path') path?: string,
  ) {
    const take = Math.min(Number(limit) || 50, 200);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

    const where: any = {};
    if (method) where.method = method.toUpperCase();
    if (statusCode) where.status_code = Number(statusCode);
    if (userId) where.user_id = Number(userId);
    if (path) where.path = { contains: path };

    const [data, total] = await Promise.all([
      this.prisma.api_logs.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take,
        skip,
      }),
      this.prisma.api_logs.count({ where }),
    ]);

    return {
      message: 'API logs retrieved successfully',
      data: {
        items: data,
        total,
        page: Number(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Thống kê API requests (Admin only)' })
  @ApiQuery({
    name: 'hours',
    required: false,
    type: Number,
    example: 24,
    description: 'Số giờ gần nhất',
  })
  async getStats(@Query('hours') hours = 24) {
    const since = new Date(Date.now() - Number(hours) * 60 * 60 * 1000);

    const [totalRequests, byMethod, byStatus, slowest, errorCount] =
      await Promise.all([
        this.prisma.api_logs.count({ where: { created_at: { gte: since } } }),
        this.prisma.api_logs.groupBy({
          by: ['method'],
          where: { created_at: { gte: since } },
          _count: { id: true },
        }),
        this.prisma.api_logs.groupBy({
          by: ['status_code'],
          where: { created_at: { gte: since } },
          _count: { id: true },
          orderBy: { status_code: 'asc' },
        }),
        this.prisma.api_logs.findMany({
          where: { created_at: { gte: since } },
          orderBy: { duration_ms: 'desc' },
          take: 10,
          select: {
            method: true,
            path: true,
            duration_ms: true,
            status_code: true,
            created_at: true,
          },
        }),
        this.prisma.api_logs.count({
          where: { created_at: { gte: since }, status_code: { gte: 400 } },
        }),
      ]);

    const avgDuration = await this.prisma.api_logs.aggregate({
      where: { created_at: { gte: since } },
      _avg: { duration_ms: true },
    });

    return {
      message: 'Stats retrieved successfully',
      data: {
        period_hours: Number(hours),
        total_requests: totalRequests,
        error_count: errorCount,
        error_rate:
          totalRequests > 0
            ? ((errorCount / totalRequests) * 100).toFixed(2) + '%'
            : '0%',
        avg_duration_ms: Math.round(avgDuration._avg.duration_ms ?? 0),
        by_method: byMethod.map((m) => ({
          method: m.method,
          count: m._count.id,
        })),
        by_status_code: byStatus.map((s) => ({
          status_code: s.status_code,
          count: s._count.id,
        })),
        slowest_endpoints: slowest,
      },
    };
  }
}
