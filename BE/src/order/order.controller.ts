import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  BadRequestException,
  Patch,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CheckoutDto, QueryOrdersDto } from './dto/checkout.dto';
import {
  GetServicesDto,
  CalculateFeeDto,
  CreateOrderDto,
  GetLeadtimeDto,
} from '../delivery/dto/ghn-order.dto';
import { AuthGuard } from '@nestjs/passport';
import { CalculateCartShippingDto } from './dto/calculate-shipping.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  CreateReturnRequestDto,
  UpdateReturnRequestDto,
} from './dto/return-request.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/constants/Permission.enum';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('calculate-cart-shipping')
  @UseGuards(JwtAuthGuard)
  async calculateCartShipping(
    @Body() body: CalculateCartShippingDto,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    if (!body.items || body.items.length === 0) {
      throw new BadRequestException('Items array cannot be empty.');
    }
    return this.orderService.calculateShippingForItems(userId, body);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createOrder(@Body() body: CheckoutDto, @Req() req: any) {
    const userId = req.user.userId;
    if (!body.shipping_address_id) {
      throw new BadRequestException('Thiếu địa chỉ giao hàng');
    }

    return this.orderService.createOrdersFromItems(
      userId,
      body.shipping_address_id,
      body.items,
      body.note,
      body.payment_method,
      req,
      body.coupon_code,
      body.user_voucher_id,
    );
  }

  @Post('create-from-product')
  @UseGuards(JwtAuthGuard)
  async createOrderFromProduct(
    @Body()
    body: {
      product_id: number;
      variant_id?: number;
      quantity: number;
      shipping_address_id: number;
      note?: string;
      payment_method?: string;
      coupon_code?: string;
      user_voucher_id?: number;
    },
    @Req() req: any,
  ) {
    const userId = req.user.userId;

    if (!body.product_id || !body.quantity || !body.shipping_address_id) {
      throw new BadRequestException(
        'Thiếu thông tin sản phẩm hoặc địa chỉ giao hàng',
      );
    }

    return this.orderService.createOrderFromProduct(
      userId,
      body.product_id,
      body.variant_id || null,
      body.quantity,
      body.shipping_address_id,
      body.note,
      body.payment_method,
      body.coupon_code,
      body.user_voucher_id,
    );
  }

  // Shipping Calculation Endpoints (Proxy to GhnService)
  @Post('shipping/services')
  async getAvailableServices(@Body() body: GetServicesDto) {
    return this.orderService.getAvailableServices(body);
  }

  @Post('shipping/preview')
  async previewShippingOrder(@Body() body: CreateOrderDto) {
    return this.orderService.previewShippingOrder(body);
  }

  @Post('shipping/leadtime')
  async getLeadtime(
    @Body() body: GetLeadtimeDto,
    @Query('shopId', ParseIntPipe) shopId: number,
  ) {
    if (!shopId) {
      throw new BadRequestException('shopId is required as a query parameter');
    }
    return this.orderService.getLeadtime(body, shopId);
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  async getMyOrders(@Req() req: any, @Query() query?: QueryOrdersDto) {
    const userId = req.user.userId;
    return this.orderService.getMyOrders(userId, query);
  }

  // Seller/Staff APIs
  @Get('seller/orders')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_ORDER)
  async getOrdersByShop(
    @Req() req: any,
    @Query('shopId') shopId?: string,
    @Query() query?: QueryOrdersDto,
  ) {
    if (!shopId) {
      throw new BadRequestException('Thiếu shopId');
    }
    return this.orderService.getOrdersByShop(
      Number(shopId),
      req.user.userId,
      query,
    );
  }

  @Get('seller/orders/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_ORDER)
  async getSellerOrderById(@Param('id') id: string, @Req() req: any) {
    return this.orderService.getSellerOrderById(Number(id), req.user.userId);
  }

  @Post('seller/orders/:id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_ORDER)
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Req() req: any,
  ) {
    if (!body?.status) {
      throw new BadRequestException('Thiếu status');
    }
    return this.orderService.updateOrderStatus(
      Number(id),
      body.status,
      req.user.userId,
    );
  }

  // Admin APIs (must be before generic :id routes)
  @Get('admin/orders')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_USERS)
  async adminListOrders(@Query() query?: QueryOrdersDto) {
    return this.orderService.adminListOrders(query);
  }

  @Get('admin/orders/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_USERS)
  async adminGetOrderById(@Param('id') id: string) {
    return this.orderService.getOrderById(Number(id));
  }

  @Post('admin/orders/:id/refund')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_USERS)
  async adminRefundOrder(@Param('id') id: string) {
    return this.orderService.adminRefundOrder(Number(id));
  }

  @Patch('admin/orders/:id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_USERS)
  async adminUpdateOrderStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    if (!body?.status) {
      throw new BadRequestException('Thiáº¿u status');
    }
    return this.orderService.updateOrderStatus(Number(id), body.status);
  }

  // Generic user order routes
  @Post(':id/confirm-received')
  @UseGuards(JwtAuthGuard)
  async confirmOrderReceived(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.orderService.confirmOrderReceived(Number(id), userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOrderById(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.orderService.getOrderById(Number(id), userId);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelOrder(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.orderService.cancelOrder(Number(id), userId);
  }

  // GHN Order Management Endpoints
  @Get(':id/ghn/track')
  @UseGuards(JwtAuthGuard)
  async trackGhnOrder(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.orderService.trackGhnOrder(Number(id), userId);
  }

  @Post(':id/ghn/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelGhnOrder(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.orderService.cancelGhnOrder(Number(id), userId);
  }

  @Patch(':id/ghn/update')
  @UseGuards(JwtAuthGuard)
  async updateGhnOrder(
    @Param('id') id: string,
    @Body() updateData: any,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    return this.orderService.updateGhnOrder(Number(id), userId, updateData);
  }

  @Post(':id/ghn/return')
  @UseGuards(JwtAuthGuard)
  async returnGhnOrder(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.orderService.returnGhnOrder(Number(id), userId);
  }

  // ===== Return/Refund Request Endpoints =====

  @Post('return-request')
  @UseGuards(JwtAuthGuard)
  async createReturnRequest(
    @Body() dto: CreateReturnRequestDto,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    const data = await this.orderService.createReturnRequest(
      userId,
      dto.order_id,
      dto.reason,
    );
    return { message: 'Return request submitted', data };
  }

  @Get('return-requests/my')
  @UseGuards(JwtAuthGuard)
  async getMyReturnRequests(@Req() req: any) {
    const userId = req.user.userId;
    const data = await this.orderService.getMyReturnRequests(userId);
    return { message: 'Return requests retrieved', data };
  }

  @Get('admin/return-requests')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_USERS)
  async adminGetReturnRequests(
    @Query() query: { status?: string; page?: number; limit?: number },
  ) {
    const data = await this.orderService.adminGetReturnRequests(query);
    return { message: 'Return requests retrieved', data };
  }

  @Patch('admin/return-requests/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_USERS)
  async adminUpdateReturnRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReturnRequestDto,
  ) {
    const data = await this.orderService.adminUpdateReturnRequest(
      id,
      dto.status,
      dto.admin_note,
      dto.refund_amount,
    );
    return { message: 'Return request updated', data };
  }
}
