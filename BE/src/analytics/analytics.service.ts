import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AnalyticsQueryDto,
  TrendsQueryDto,
  TopProductsQueryDto,
  RevenueBreakdownQueryDto,
  StockAlertsQueryDto,
  NotificationsQueryDto,
  OrderStatsQueryDto,
} from './dto/analytics-query.dto';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // Helper: Check if user is admin
  private async isAdmin(userId: number): Promise<boolean> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    return user?.role?.name === 'admin';
  }

  // Helper: Check if user has access to shop
  private async checkShopAccess(shopId: number, userId: number) {
    // Admin có quyền truy cập tất cả các shop
    const isUserAdmin = await this.isAdmin(userId);
    if (isUserAdmin) {
      return;
    }

    const shop = await this.prisma.shops.findFirst({
      where: {
        id: shopId,
        owner_id: userId,
      },
    });

    if (!shop) {
      const shopStaff = await this.prisma.shop_staffs.findFirst({
        where: {
          shop_id: shopId,
          user_id: userId,
        },
      });

      if (!shopStaff) {
        throw new ForbiddenException('You do not have access to this shop');
      }
    }
  }

  // Helper: Get date range from period
  private getDateRange(period: string, startDate?: string, endDate?: string) {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (period) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        start = startDate
          ? new Date(startDate)
          : new Date(now.getFullYear(), now.getMonth(), 1);
        if (startDate) {
          start.setHours(0, 0, 0, 0);
        }
        end = endDate ? new Date(endDate) : now;
        if (endDate) {
          end.setHours(23, 59, 59, 999);
        }
        break;
      case 'all':
        start = new Date(0);
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { start, end };
  }

  // 1. Get Shop Overview Statistics
  async getOverview(shopId: number, userId: number, query: AnalyticsQueryDto) {
    await this.checkShopAccess(shopId, userId);

    const { period = 'month', startDate, endDate } = query;
    const { start, end } = this.getDateRange(period, startDate, endDate);

    // Get orders statistics
    const orders = await this.prisma.orders.findMany({
      where: {
        shop_id: shopId,
        created_at: {
          gte: start,
          lte: end,
        },
      },
      select: {
        total_amount: true,
        status: true,
      },
    });

    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(order.total_amount),
      0,
    );
    const totalOrders = orders.length;
    const completedOrders = orders.filter(
      (o) => o.status === 'delivered',
    ).length;
    const pendingOrders = orders.filter((o) => o.status === 'pending').length;

    // Get product statistics
    const products = await this.prisma.products.count({
      where: { shop_id: shopId },
    });

    // Get customer count (unique users who ordered)
    const customers = await this.prisma.orders.findMany({
      where: {
        shop_id: shopId,
        created_at: {
          gte: start,
          lte: end,
        },
      },
      distinct: ['user_id'],
      select: { user_id: true },
    });

    // Calculate growth rates (compare with previous period)
    const periodDuration = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - periodDuration);
    const prevEnd = start;

    const prevOrders = await this.prisma.orders.findMany({
      where: {
        shop_id: shopId,
        created_at: {
          gte: prevStart,
          lt: prevEnd,
        },
      },
      select: { total_amount: true },
    });

    const prevRevenue = prevOrders.reduce(
      (sum, order) => sum + Number(order.total_amount),
      0,
    );
    const revenueGrowth =
      prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const ordersGrowth =
      prevOrders.length > 0
        ? ((totalOrders - prevOrders.length) / prevOrders.length) * 100
        : 0;

    return {
      period,
      dateRange: { start, end },
      overview: {
        totalRevenue,
        totalOrders,
        completedOrders,
        pendingOrders,
        totalProducts: products,
        totalCustomers: customers.length,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        conversionRate: 0, // Would need view tracking
      },
      growth: {
        revenue: revenueGrowth,
        orders: ordersGrowth,
      },
    };
  }

  // 2. Get Sales Trends
  async getSalesTrends(shopId: number, userId: number, query: TrendsQueryDto) {
    await this.checkShopAccess(shopId, userId);

    const { period = 'month', limit = 12, startDate, endDate } = query;
    const trendPeriod = period === 'today' ? 'day' : period;
    const trends: Array<{
      label: string;
      period: { start: Date; end: Date };
      revenue: number;
      orders: number;
    }> = [];

    if (trendPeriod === 'custom') {
      const { start: rangeStart, end: rangeEnd } = this.getDateRange(
        trendPeriod,
        startDate,
        endDate,
      );
      const dayMs = 24 * 60 * 60 * 1000;
      const totalDays = Math.max(
        1,
        Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / dayMs) + 1,
      );
      const bucketCount = Math.min(limit, totalDays);

      for (let i = bucketCount - 1; i >= 0; i--) {
        let start = new Date(rangeEnd);
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - i);
        if (start < rangeStart) {
          start = new Date(rangeStart);
        }

        let end = new Date(start);
        end.setHours(23, 59, 59, 999);
        if (end > rangeEnd) {
          end = new Date(rangeEnd);
        }

        const orders = await this.prisma.orders.findMany({
          where: {
            shop_id: shopId,
            created_at: {
              gte: start,
              lte: end,
            },
          },
          select: { total_amount: true },
        });

        const revenue = orders.reduce(
          (sum, order) => sum + Number(order.total_amount),
          0,
        );

        trends.push({
          label: start.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
          }),
          period: { start, end },
          revenue,
          orders: orders.length,
        });
      }

      return { period, data: trends };
    }

    for (let i = limit - 1; i >= 0; i--) {
      let start: Date = new Date();
      let end: Date = new Date();
      let label: string = '';

      switch (trendPeriod) {
        case 'day':
          start = new Date();
          start.setDate(start.getDate() - i);
          start.setHours(0, 0, 0, 0);
          end = new Date(start);
          end.setHours(23, 59, 59, 999);
          label = start.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
          });
          break;
        case 'week':
          start = new Date();
          start.setDate(start.getDate() - i * 7);
          end = new Date(start);
          end.setDate(end.getDate() + 6);
          label = `Tuần ${start.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;
          break;
        case 'month':
          start = new Date();
          start.setMonth(start.getMonth() - i);
          start.setDate(1);
          end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
          label = start.toLocaleDateString('vi-VN', {
            month: '2-digit',
            year: 'numeric',
          });
          break;
        case 'year':
          start = new Date();
          start.setFullYear(start.getFullYear() - i);
          start.setMonth(0, 1);
          end = new Date(start.getFullYear(), 11, 31);
          label = start.getFullYear().toString();
          break;
      }

      const orders = await this.prisma.orders.findMany({
        where: {
          shop_id: shopId,
          created_at: {
            gte: start,
            lte: end,
          },
        },
        select: { total_amount: true },
      });

      const revenue = orders.reduce(
        (sum, order) => sum + Number(order.total_amount),
        0,
      );

      trends.push({
        label,
        period: { start, end },
        revenue,
        orders: orders.length,
      });
    }

    return { period, data: trends };
  }

  // 3. Get Top Products
  async getTopProducts(
    shopId: number,
    userId: number,
    query: TopProductsQueryDto,
  ) {
    await this.checkShopAccess(shopId, userId);

    const {
      limit = 5,
      period = 'month',
      sortBy = 'sales',
      startDate,
      endDate,
    } = query;
    const { start, end } = this.getDateRange(period, startDate, endDate);

    const orderItems = await this.prisma.order_items.findMany({
      where: {
        order: {
          shop_id: shopId,
          created_at: {
            gte: start,
            lte: end,
          },
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            product_media: {
              select: {
                url: true,
                type: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    // Group by product
    const productStats = orderItems.reduce((acc, item) => {
      const productId = item.product_id;
      if (!acc[productId]) {
        acc[productId] = {
          product: item.product,
          totalSales: 0,
          totalRevenue: 0,
          totalQuantity: 0,
        };
      }
      acc[productId].totalSales++;
      acc[productId].totalRevenue += Number(item.unit_price) * item.quantity;
      acc[productId].totalQuantity += item.quantity;
      return acc;
    }, {});

    // Convert to array and sort
    const topProducts = Object.values(productStats);

    switch (sortBy) {
      case 'sales':
        topProducts.sort((a: any, b: any) => b.totalSales - a.totalSales);
        break;
      case 'revenue':
        topProducts.sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);
        break;
      case 'views':
        // Would need view tracking
        break;
    }

    return {
      period,
      sortBy,
      data: topProducts.slice(0, limit),
    };
  }

  // 4. Get Engagement Metrics
  async getEngagementMetrics(
    shopId: number,
    userId: number,
    query: AnalyticsQueryDto,
  ) {
    await this.checkShopAccess(shopId, userId);

    const { period = 'month', startDate, endDate } = query;
    const { start, end } = this.getDateRange(period, startDate, endDate);

    // Get new reviews count
    const products = await this.prisma.products.findMany({
      where: { shop_id: shopId },
      select: { id: true },
    });

    const productIds = products.map((p) => p.id);

    const newReviews = await this.prisma.reviews.count({
      where: {
        product_id: { in: productIds },
        is_deleted: false,
        created_at: {
          gte: start,
          lte: end,
        },
      },
    });

    // Get message conversations
    const conversations = await this.prisma.conversations.count({
      where: {
        type: 'user_shop',
        participants: {
          some: {
            shop_id: shopId,
            entity_type: 'shop',
          },
        },
        created_at: {
          gte: start,
          lte: end,
        },
      },
    });

    return {
      period,
      engagement: {
        newReviews,
        newConversations: conversations,
      },
    };
  }

  // 5. Get Revenue Breakdown
  async getRevenueBreakdown(
    shopId: number,
    userId: number,
    query: RevenueBreakdownQueryDto,
  ) {
    await this.checkShopAccess(shopId, userId);

    const { period = 'month', groupBy = 'category' } = query;
    const { start, end } = this.getDateRange(period);

    if (groupBy === 'category') {
      const orderItems = await this.prisma.order_items.findMany({
        where: {
          order: {
            shop_id: shopId,
            created_at: {
              gte: start,
              lte: end,
            },
          },
        },
        include: {
          product: {
            include: {
              product_categories: {
                include: {
                  category: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const categoryStats = orderItems.reduce((acc, item) => {
        // Get first category if product has multiple categories
        const category = item.product.product_categories[0]?.category;
        const categoryId = category?.id || 0;
        const categoryName = category?.name || 'Uncategorized';
        if (!acc[categoryId]) {
          acc[categoryId] = {
            category: categoryName,
            revenue: 0,
            orders: 0,
          };
        }
        acc[categoryId].revenue += Number(item.unit_price) * item.quantity;
        acc[categoryId].orders++;
        return acc;
      }, {});

      return {
        period,
        groupBy,
        data: Object.values(categoryStats),
      };
    }

    // Add other groupBy options as needed
    return { period, groupBy, data: [] };
  }

  // 6. Get Stock Alerts
  async getStockAlerts(
    shopId: number,
    userId: number,
    query: StockAlertsQueryDto,
  ) {
    await this.checkShopAccess(shopId, userId);

    const { threshold = 10 } = query;

    const lowStockProducts = await this.prisma.product_variants.findMany({
      where: {
        product: {
          shop_id: shopId,
        },
        stock: {
          lte: threshold,
          gt: 0,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            product_media: {
              select: {
                url: true,
                type: true,
              },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        stock: 'asc',
      },
    });

    const outOfStockProducts = await this.prisma.product_variants.findMany({
      where: {
        product: {
          shop_id: shopId,
        },
        stock: 0,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            product_media: {
              select: {
                url: true,
                type: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    return {
      threshold,
      lowStock: lowStockProducts,
      outOfStock: outOfStockProducts,
      summary: {
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
      },
    };
  }

  // 7. Get Notifications/Activities
  async getNotifications(
    shopId: number,
    userId: number,
    query: NotificationsQueryDto,
  ) {
    await this.checkShopAccess(shopId, userId);

    const { limit = 10, type = 'all' } = query;

    // Get recent orders
    const recentOrders =
      type === 'all' || type === 'order'
        ? await this.prisma.orders.findMany({
            where: { shop_id: shopId },
            orderBy: { created_at: 'desc' },
            take: limit,
            select: {
              id: true,
              status: true,
              total_amount: true,
              created_at: true,
              user: {
                select: {
                  full_name: true,
                },
              },
            },
          })
        : [];

    // Get recent messages
    const recentMessages =
      type === 'all' || type === 'message'
        ? await this.prisma.messages.findMany({
            where: {
              conversation: {
                participants: {
                  some: {
                    shop_id: shopId,
                    entity_type: 'shop',
                  },
                },
              },
              sender_type: 'user', // Only user messages to shop
            },
            orderBy: { created_at: 'desc' },
            take: limit,
            include: {
              sender: {
                select: {
                  full_name: true,
                },
              },
            },
          })
        : [];

    // Format notifications
    const notifications = [
      ...recentOrders.map((order) => ({
        id: `order_${order.id}`,
        type: 'order',
        title: 'New Order',
        message: `${order.user.full_name} placed an order`,
        metadata: order,
        createdAt: order.created_at,
      })),
      ...recentMessages.map((msg) => ({
        id: `message_${msg.id}`,
        type: 'message',
        title: 'New Message',
        message: `${msg.sender?.full_name} sent you a message`,
        metadata: msg,
        createdAt: msg.created_at,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    return {
      type,
      limit,
      data: notifications,
    };
  }

  // 8. Get Order Statistics
  async getOrderStats(
    shopId: number,
    userId: number,
    query: OrderStatsQueryDto,
  ) {
    await this.checkShopAccess(shopId, userId);

    const { period = 'month', status = 'all' } = query;
    const { start, end } = this.getDateRange(period);

    const whereClause: any = {
      shop_id: shopId,
      created_at: {
        gte: start,
        lte: end,
      },
    };

    if (status !== 'all') {
      whereClause.status = status;
    }

    const orders = await this.prisma.orders.findMany({
      where: whereClause,
      select: {
        status: true,
        total_amount: true,
      },
    });

    const stats = {
      total: orders.length,
      byStatus: {
        pending: orders.filter((o) => o.status === 'pending').length,
        processing: orders.filter((o) => o.status === 'processing').length,
        shipped: orders.filter((o) => o.status === 'shipped').length,
        delivered: orders.filter((o) => o.status === 'delivered').length,
        cancelled: orders.filter((o) => o.status === 'cancelled').length,
      },
      totalRevenue: orders.reduce(
        (sum, order) => sum + Number(order.total_amount),
        0,
      ),
    };

    return {
      period,
      status,
      stats,
    };
  }

  // 9. Get Customer Statistics
  async getCustomerStats(
    shopId: number,
    userId: number,
    query: AnalyticsQueryDto,
  ) {
    await this.checkShopAccess(shopId, userId);

    const { period = 'month' } = query;
    const { start, end } = this.getDateRange(period);

    // Get unique customers in period
    const customers = await this.prisma.orders.findMany({
      where: {
        shop_id: shopId,
        created_at: {
          gte: start,
          lte: end,
        },
      },
      distinct: ['user_id'],
      select: {
        user_id: true,
      },
    });

    // Get returning customers (ordered before this period)
    const returningCustomers = await this.prisma.orders.findMany({
      where: {
        shop_id: shopId,
        user_id: { in: customers.map((c) => c.user_id) },
        created_at: {
          lt: start,
        },
      },
      distinct: ['user_id'],
      select: { user_id: true },
    });

    const newCustomers = customers.length - returningCustomers.length;

    return {
      period,
      stats: {
        totalCustomers: customers.length,
        newCustomers,
        returningCustomers: returningCustomers.length,
        retentionRate:
          customers.length > 0
            ? (returningCustomers.length / customers.length) * 100
            : 0,
      },
    };
  }

  // 10. Get Conversion Funnel
  async getConversionFunnel(
    shopId: number,
    userId: number,
    query: AnalyticsQueryDto,
  ) {
    await this.checkShopAccess(shopId, userId);

    const { period = 'month' } = query;
    const { start, end } = this.getDateRange(period);

    // Get products
    const products = await this.prisma.products.findMany({
      where: { shop_id: shopId },
      select: { id: true, view_count: true },
    });

    const productIds = products.map((p) => p.id);

    // Real product view count summed across all shop products
    const views = products.reduce((sum, p) => sum + (p.view_count || 0), 0);

    // Cart additions
    const cartAdditions = await this.prisma.cart_items.count({
      where: {
        product_id: { in: productIds },
        created_at: {
          gte: start,
          lte: end,
        },
      },
    });

    // Orders
    const orders = await this.prisma.orders.count({
      where: {
        shop_id: shopId,
        created_at: {
          gte: start,
          lte: end,
        },
      },
    });

    // Completed orders
    const completedOrders = await this.prisma.orders.count({
      where: {
        shop_id: shopId,
        status: 'delivered',
        created_at: {
          gte: start,
          lte: end,
        },
      },
    });

    return {
      period,
      funnel: {
        views: { count: views, label: 'Product Views' },
        cartAdditions: { count: cartAdditions, label: 'Add to Cart', rate: 0 },
        orders: {
          count: orders,
          label: 'Orders Placed',
          rate: cartAdditions > 0 ? (orders / cartAdditions) * 100 : 0,
        },
        completed: {
          count: completedOrders,
          label: 'Completed',
          rate: orders > 0 ? (completedOrders / orders) * 100 : 0,
        },
      },
    };
  }

  // ============ ADMIN DASHBOARD METHODS ============

  /**
   * Get platform-wide statistics for admin dashboard
   */
  async getAdminStats(
    userId: number,
    query: { period?: string; startDate?: string; endDate?: string },
  ) {
    // Check if user is admin
    const isUserAdmin = await this.isAdmin(userId);
    if (!isUserAdmin) {
      throw new ForbiddenException(
        'Only admins can access platform statistics',
      );
    }

    const { period = 'month', startDate, endDate } = query;
    const { start, end } = this.getDateRange(period, startDate, endDate);

    // Get total users
    const totalUsers = await this.prisma.users.count();

    // Get users created in this period
    const newUsers = await this.prisma.users.count({
      where: {
        created_at: {
          gte: start,
          lte: end,
        },
      },
    });

    // Get users from previous period for growth calculation
    const periodDuration = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - periodDuration);
    const prevNewUsers = await this.prisma.users.count({
      where: {
        created_at: {
          gte: prevStart,
          lt: start,
        },
      },
    });

    const userGrowth =
      prevNewUsers > 0 ? ((newUsers - prevNewUsers) / prevNewUsers) * 100 : 0;

    // Get active shops (shops with at least one product)
    const activeShops = await this.prisma.shops.count({
      where: {
        products: {
          some: {},
        },
      },
    });

    // Get new shops in this period
    const newShops = await this.prisma.shops.count({
      where: {
        created_at: {
          gte: start,
          lte: end,
        },
      },
    });

    // Get shops from previous period
    const prevNewShops = await this.prisma.shops.count({
      where: {
        created_at: {
          gte: prevStart,
          lt: start,
        },
      },
    });

    const shopGrowth =
      prevNewShops > 0 ? ((newShops - prevNewShops) / prevNewShops) * 100 : 0;

    // Get total products
    const totalProducts = await this.prisma.products.count({
      where: {
        moderation_status: 'approved',
      },
    });

    // Get new products in this period
    const newProducts = await this.prisma.products.count({
      where: {
        created_at: {
          gte: start,
          lte: end,
        },
        moderation_status: 'approved',
      },
    });

    // Get products from previous period
    const prevNewProducts = await this.prisma.products.count({
      where: {
        created_at: {
          gte: prevStart,
          lt: start,
        },
        moderation_status: 'approved',
      },
    });

    const productGrowth =
      prevNewProducts > 0
        ? ((newProducts - prevNewProducts) / prevNewProducts) * 100
        : 0;

    return {
      total_users: totalUsers,
      user_growth: userGrowth,
      active_sellers: activeShops,
      seller_growth: shopGrowth,
      total_products: totalProducts,
      product_growth: productGrowth,
    };
  }

  /**
   * Get platform-wide revenue trends for admin dashboard
   */
  async getAdminRevenueTrend(
    userId: number,
    query: { period?: string; limit?: number },
  ) {
    // Check if user is admin
    const isUserAdmin = await this.isAdmin(userId);
    if (!isUserAdmin) {
      throw new ForbiddenException(
        'Only admins can access platform revenue trends',
      );
    }

    const { period = 'month', limit = 6 } = query;
    const trends: Array<{
      month: string;
      revenue: number;
    }> = [];

    for (let i = limit - 1; i >= 0; i--) {
      let start: Date = new Date();
      let end: Date = new Date();
      let label: string = '';

      // For simplicity, we'll use month-based trends
      start = new Date();
      start.setMonth(start.getMonth() - i);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);

      // Format label as "Jan", "Feb", etc.
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      label = monthNames[start.getMonth()];

      const orders = await this.prisma.orders.findMany({
        where: {
          created_at: {
            gte: start,
            lte: end,
          },
          status: {
            in: ['processing', 'shipped', 'delivered'],
          },
        },
        select: { total_amount: true },
      });

      const revenue = orders.reduce(
        (sum, order) => sum + Number(order.total_amount),
        0,
      );

      trends.push({
        month: label,
        revenue,
      });
    }

    return trends;
  }

  /**
   * Get product category distribution for admin dashboard
   */
  async getAdminProductCategories(userId: number) {
    // Check if user is admin
    const isUserAdmin = await this.isAdmin(userId);
    if (!isUserAdmin) {
      throw new ForbiddenException(
        'Only admins can access product category statistics',
      );
    }

    // Get all product categories with counts
    const categories = await this.prisma.categories.findMany({
      include: {
        product_categories: {
          where: {
            product: {
              moderation_status: 'approved',
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Define colors for categories
    const colors = [
      '#EC4899',
      '#A855F7',
      '#3B82F6',
      '#F59E0B',
      '#10B981',
      '#EF4444',
      '#8B5CF6',
      '#F97316',
    ];

    // Map categories to the format expected by frontend
    const categoryData = categories
      .map((cat, index) => ({
        category: cat.name,
        value: cat.product_categories.length,
        color: colors[index % colors.length],
      }))
      .filter((cat) => cat.value > 0) // Only include categories with products
      .sort((a, b) => b.value - a.value) // Sort by count descending
      .slice(0, 8); // Limit to top 8 categories

    return categoryData;
  }

  /**
   * Get detailed revenue statistics for admin dashboard
   */
  async getAdminRevenueDetails(
    userId: number,
    query: { period?: string; startDate?: string; endDate?: string },
  ) {
    const isUserAdmin = await this.isAdmin(userId);
    if (!isUserAdmin) {
      throw new ForbiddenException('Only admins can access revenue details');
    }

    const { period = 'all', startDate, endDate } = query;
    const isAllTime = period === 'all';

    let dateFilter: any = {};
    let start: Date;
    let end: Date;

    if (!isAllTime) {
      const range = this.getDateRange(period, startDate, endDate);
      start = range.start;
      end = range.end;
      dateFilter = { created_at: { gte: start, lte: end } };
    } else {
      // all time — pick min/max from actual data
      const minMax = await this.prisma.orders.aggregate({
        _min: { created_at: true },
        _max: { created_at: true },
      });
      start = minMax._min.created_at ?? new Date(0);
      end = minMax._max.created_at ?? new Date();
    }

    // Fetch all orders in period with shop info
    const orders = await this.prisma.orders.findMany({
      where: dateFilter,
      select: {
        total_amount: true,
        status: true,
        created_at: true,
        shop: { select: { id: true, name: true } },
      },
    });

    const totalRevenue = orders.reduce(
      (sum, o) => sum + Number(o.total_amount),
      0,
    );
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const completedOrders = orders.filter(
      (o) => o.status === 'delivered',
    ).length;
    const cancelledOrders = orders.filter(
      (o) => o.status === 'cancelled',
    ).length;

    // Revenue growth vs previous period (skip for all-time)
    let revenueGrowth = 0;
    let ordersGrowth = 0;
    if (!isAllTime) {
      const periodDuration = end.getTime() - start.getTime();
      const prevStart = new Date(start.getTime() - periodDuration);
      const prevOrders = await this.prisma.orders.findMany({
        where: { created_at: { gte: prevStart, lt: start } },
        select: { total_amount: true },
      });
      const prevRevenue = prevOrders.reduce(
        (sum, o) => sum + Number(o.total_amount),
        0,
      );
      revenueGrowth =
        prevRevenue > 0
          ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
          : 0;
      ordersGrowth =
        prevOrders.length > 0
          ? ((totalOrders - prevOrders.length) / prevOrders.length) * 100
          : 0;
    }

    // Revenue by order status
    const statusList = [
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
    ];
    const revenueByStatus = statusList.map((s) => ({
      status: s,
      revenue: orders
        .filter((o) => o.status === s)
        .reduce((sum, o) => sum + Number(o.total_amount), 0),
      count: orders.filter((o) => o.status === s).length,
    }));

    // Top shops by revenue
    const shopMap: Record<
      number,
      { id: number; name: string; revenue: number; orders: number }
    > = {};
    for (const order of orders) {
      const sid = order.shop.id;
      if (!shopMap[sid]) {
        shopMap[sid] = {
          id: sid,
          name: order.shop.name,
          revenue: 0,
          orders: 0,
        };
      }
      shopMap[sid].revenue += Number(order.total_amount);
      shopMap[sid].orders++;
    }
    const topShops = Object.values(shopMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Revenue trend (granularity based on period / date range)
    const revenueByPeriod = this.buildAdminRevenueTrend(
      orders,
      start,
      end,
      period,
    );

    return {
      period,
      dateRange: { start, end },
      summary: {
        totalRevenue,
        revenueGrowth,
        totalOrders,
        ordersGrowth,
        avgOrderValue,
        completedOrders,
        cancelledOrders,
      },
      revenueByStatus,
      topShops,
      revenueByPeriod,
    };
  }

  private buildAdminRevenueTrend(
    orders: Array<{
      total_amount: any;
      status: string;
      created_at: Date;
      shop: { id: number; name: string };
    }>,
    start: Date,
    end: Date,
    period: string,
  ): Array<{ label: string; revenue: number; orders: number }> {
    const trends: Array<{ label: string; revenue: number; orders: number }> =
      [];
    const dayMs = 24 * 60 * 60 * 1000;
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / dayMs);

    if (period === 'today') {
      // Hourly buckets 0–23
      for (let h = 0; h < 24; h++) {
        const bucket = orders.filter((o) => {
          const d = new Date(o.created_at);
          return d.getHours() === h && d >= start && d <= end;
        });
        trends.push({
          label: `${h}:00`,
          revenue: bucket.reduce((s, o) => s + Number(o.total_amount), 0),
          orders: bucket.length,
        });
      }
    } else if (diffDays <= 31) {
      // Daily buckets
      for (let i = 0; i <= diffDays; i++) {
        const day = new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate() + i,
        );
        if (day > end) break;
        const next = new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate() + 1,
        );
        const bucket = orders.filter((o) => {
          const d = new Date(o.created_at);
          return d >= day && d < next;
        });
        trends.push({
          label: day.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
          }),
          revenue: bucket.reduce((s, o) => s + Number(o.total_amount), 0),
          orders: bucket.length,
        });
      }
    } else {
      // Monthly buckets
      const monthNames = [
        'Th1',
        'Th2',
        'Th3',
        'Th4',
        'Th5',
        'Th6',
        'Th7',
        'Th8',
        'Th9',
        'Th10',
        'Th11',
        'Th12',
      ];
      let cur = new Date(start.getFullYear(), start.getMonth(), 1);
      while (cur <= end) {
        const monthStart = new Date(cur);
        const monthEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
        const bucket = orders.filter((o) => {
          const d = new Date(o.created_at);
          return d >= monthStart && d < monthEnd;
        });
        trends.push({
          label: `${monthNames[cur.getMonth()]}/${cur.getFullYear()}`,
          revenue: bucket.reduce((s, o) => s + Number(o.total_amount), 0),
          orders: bucket.length,
        });
        cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      }
    }
    return trends;
  }

  async getProductStats(
    shopId: number,
    userId: number,
    query: AnalyticsQueryDto,
  ) {
    await this.checkShopAccess(shopId, userId);

    const { period = 'month' } = query;
    const { start, end } = this.getDateRange(period);

    const products = await this.prisma.products.findMany({
      where: { shop_id: shopId, is_deleted: false },
      select: {
        id: true,
        name: true,
        slug: true,
        view_count: true,
        review_count: true,
        avg_rating: true,
        product_media: { select: { url: true }, take: 1 },
        tryon_items: {
          where: {
            session: { created_at: { gte: start, lte: end } },
          },
          select: { id: true },
        },
        order_items: {
          where: {
            order: {
              status: 'delivered',
              created_at: { gte: start, lte: end },
            },
          },
          select: { quantity: true },
        },
      },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      image: p.product_media[0]?.url || null,
      view_count: p.view_count,
      tryon_count: p.tryon_items.length,
      review_count: p.review_count,
      avg_rating: Number(p.avg_rating) || 0,
      sold_count: p.order_items.reduce((sum, item) => sum + item.quantity, 0),
    }));
  }
}
