/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type TrashResource =
  | 'users'
  | 'shops'
  | 'products'
  | 'product_variants'
  | 'orders'
  | 'reviews'
  | 'coupons'
  | 'messages';

type TrashResourceConfig = {
  delegate: string;
  label: string;
  updatedAt?: boolean;
  buildSearchWhere: (search: string) => Record<string, unknown>;
  include?: Record<string, unknown>;
  toItem: (record: any) => TrashItem;
};

export type TrashItem = {
  id: number;
  resource: TrashResource;
  title: string;
  subtitle?: string | null;
  deleted_at: Date | null;
  created_at?: Date | null;
  metadata?: Record<string, string | number | boolean | null>;
};

type ProductRestoreRequestReason = {
  status?: string;
  note?: string | null;
  product_name?: string;
  requested_at?: string;
  approved_at?: string;
  rejected_at?: string;
  admin_id?: number;
};

const contains = (value: string) => ({ contains: value, mode: 'insensitive' });

@Injectable()
export class TrashService {
  private readonly configs: Record<TrashResource, TrashResourceConfig> = {
    users: {
      delegate: 'users',
      label: 'Users',
      updatedAt: true,
      buildSearchWhere: (search) => ({
        OR: [
          { email: contains(search) },
          { full_name: contains(search) },
          { phone: contains(search) },
        ],
      }),
      include: { role: { select: { name: true } } },
      toItem: (user) => ({
        id: user.id,
        resource: 'users',
        title: user.full_name || user.email || `User #${user.id}`,
        subtitle: user.email,
        deleted_at: user.deleted_at,
        created_at: user.created_at,
        metadata: {
          phone: user.phone,
          role: user.role?.name || null,
          active: user.is_active,
        },
      }),
    },
    shops: {
      delegate: 'shops',
      label: 'Shops',
      updatedAt: true,
      buildSearchWhere: (search) => ({
        OR: [
          { name: contains(search) },
          { slug: contains(search) },
          { email: contains(search) },
          { phone: contains(search) },
        ],
      }),
      include: {
        owner: { select: { id: true, email: true, full_name: true } },
      },
      toItem: (shop) => ({
        id: shop.id,
        resource: 'shops',
        title: shop.name || `Shop #${shop.id}`,
        subtitle: shop.slug,
        deleted_at: shop.deleted_at,
        created_at: shop.created_at,
        metadata: {
          email: shop.email,
          owner: shop.owner?.full_name || shop.owner?.email || null,
          verified: shop.is_verified,
        },
      }),
    },
    products: {
      delegate: 'products',
      label: 'Products',
      updatedAt: true,
      buildSearchWhere: (search) => ({
        OR: [{ name: contains(search) }, { slug: contains(search) }],
      }),
      include: { shop: { select: { id: true, name: true } } },
      toItem: (product) => ({
        id: product.id,
        resource: 'products',
        title: product.name || `Product #${product.id}`,
        subtitle: product.shop?.name || product.slug,
        deleted_at: product.deleted_at,
        created_at: product.created_at,
        metadata: {
          moderation: product.moderation_status,
          published: product.is_published,
          reviews: product.review_count,
        },
      }),
    },
    product_variants: {
      delegate: 'product_variants',
      label: 'Product variants',
      updatedAt: true,
      buildSearchWhere: (search) => ({
        OR: [
          { sku: contains(search) },
          { name: contains(search) },
          { size_label: contains(search) },
        ],
      }),
      include: { product: { select: { id: true, name: true } } },
      toItem: (variant) => ({
        id: variant.id,
        resource: 'product_variants',
        title: variant.name || variant.sku || `Variant #${variant.id}`,
        subtitle: variant.product?.name || variant.sku,
        deleted_at: variant.deleted_at,
        created_at: variant.created_at,
        metadata: {
          sku: variant.sku,
          price: variant.price?.toString?.() ?? null,
          stock: variant.stock,
          active: variant.is_active,
        },
      }),
    },
    orders: {
      delegate: 'orders',
      label: 'Orders',
      updatedAt: true,
      buildSearchWhere: (search) => ({
        OR: [{ ghn_order_code: contains(search) }, { note: contains(search) }],
      }),
      include: {
        user: { select: { id: true, email: true, full_name: true } },
        shop: { select: { id: true, name: true } },
      },
      toItem: (order) => ({
        id: order.id,
        resource: 'orders',
        title: `Order #${order.id}`,
        subtitle:
          order.user?.full_name ||
          order.user?.email ||
          order.shop?.name ||
          order.ghn_order_code,
        deleted_at: order.deleted_at,
        created_at: order.created_at,
        metadata: {
          status: order.status,
          payment: order.payment_status,
          total: order.total_amount?.toString?.() ?? null,
          shop: order.shop?.name || null,
        },
      }),
    },
    reviews: {
      delegate: 'reviews',
      label: 'Reviews',
      buildSearchWhere: (search) => ({
        OR: [{ title: contains(search) }, { content: contains(search) }],
      }),
      include: {
        user: { select: { id: true, email: true, full_name: true } },
        product: { select: { id: true, name: true } },
      },
      toItem: (review) => ({
        id: review.id,
        resource: 'reviews',
        title: review.title || review.content || `Review #${review.id}`,
        subtitle: review.product?.name || review.user?.email || null,
        deleted_at: review.deleted_at,
        created_at: review.created_at,
        metadata: {
          rating: review.rating,
          reviewer: review.user?.full_name || review.user?.email || null,
          verified: review.is_verified_purchase,
        },
      }),
    },
    coupons: {
      delegate: 'coupons',
      label: 'Coupons',
      buildSearchWhere: (search) => ({
        OR: [{ code: contains(search) }, { description: contains(search) }],
      }),
      toItem: (coupon) => ({
        id: coupon.id,
        resource: 'coupons',
        title: coupon.code || `Coupon #${coupon.id}`,
        subtitle: coupon.description,
        deleted_at: coupon.deleted_at,
        created_at: coupon.created_at,
        metadata: {
          type: coupon.discount_type,
          value: coupon.discount_value?.toString?.() ?? null,
          usage: coupon.used_count,
        },
      }),
    },
    messages: {
      delegate: 'messages',
      label: 'Messages',
      buildSearchWhere: (search) => ({
        OR: [{ content: contains(search) }, { sender_type: contains(search) }],
      }),
      include: {
        sender: { select: { id: true, email: true, full_name: true } },
        sender_shop: { select: { id: true, name: true } },
      },
      toItem: (message) => ({
        id: message.id,
        resource: 'messages',
        title:
          message.content?.slice(0, 80) ||
          `${message.type || 'Message'} #${message.id}`,
        subtitle:
          message.sender?.full_name ||
          message.sender?.email ||
          message.sender_shop?.name ||
          message.sender_type,
        deleted_at: message.deleted_at,
        created_at: message.created_at,
        metadata: {
          type: message.type,
          conversation: message.conversation_id,
          senderType: message.sender_type,
        },
      }),
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  getResources() {
    return Object.entries(this.configs).map(([key, config]) => ({
      key,
      label: config.label,
    }));
  }

  async getSummary() {
    const entries = await Promise.all(
      this.getResourceKeys().map(async (resource) => {
        const delegate = this.getDelegate(resource);
        const count = await delegate.count({ where: { is_deleted: true } });
        return { resource, count };
      }),
    );

    return {
      message: 'Trash summary retrieved',
      data: {
        total: entries.reduce((sum, item) => sum + item.count, 0),
        resources: entries,
      },
    };
  }

  async findDeleted({
    resource,
    page,
    limit,
    search,
  }: {
    resource: TrashResource;
    page: number;
    limit: number;
    search?: string;
  }) {
    const config = this.getConfig(resource);
    const delegate = this.getDelegate(resource);
    const take = Math.min(Math.max(limit || 20, 1), 100);
    const safePage = Math.max(page || 1, 1);
    const skip = (safePage - 1) * take;
    const where = this.buildWhere(resource, search);

    const [items, total] = await Promise.all([
      delegate.findMany({
        where,
        include: config.include,
        orderBy: [{ deleted_at: 'desc' }, { id: 'desc' }],
        skip,
        take,
      }),
      delegate.count({ where }),
    ]);

    return {
      message: 'Deleted items retrieved',
      data: {
        resource,
        items: items.map((item) => config.toItem(item)),
        total,
        page: safePage,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async getProductRestoreRequests() {
    const logs = await this.prisma.moderation_logs.findMany({
      where: {
        target_type: 'product',
        action: 'restore_requested',
      },
      include: {
        moderator: { select: { id: true, email: true, full_name: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    });

    const pendingLogs = logs
      .map((log) => ({
        log,
        reason: this.parseRestoreRequestReason(log.reason),
      }))
      .filter(({ reason }) => reason?.status === 'pending');

    const productIds = [...new Set(pendingLogs.map(({ log }) => log.target_id))];
    const products = await this.prisma.products.findMany({
      where: { id: { in: productIds } },
      include: {
        shop: { select: { id: true, name: true } },
      },
    });
    const productMap = new Map(products.map((product) => [product.id, product]));

    return {
      message: 'Product restore requests retrieved',
      data: pendingLogs.filter(({ log }) => {
        const product = productMap.get(log.target_id);
        return product?.is_deleted;
      }).map(({ log, reason }) => {
        const product = productMap.get(log.target_id);
        return {
          id: log.id,
          product_id: log.target_id,
          product_name:
            product?.name || reason?.product_name || `Product #${log.target_id}`,
          shop_id: product?.shop?.id ?? null,
          shop_name: product?.shop?.name ?? null,
          requester_id: log.moderator.id,
          requester_name: log.moderator.full_name,
          requester_email: log.moderator.email,
          requested_at: reason?.requested_at || log.created_at,
          note: reason?.note || null,
          product_deleted: product?.is_deleted ?? false,
        };
      }),
    };
  }

  async restore(resource: TrashResource, id: number) {
    const config = this.getConfig(resource);
    const delegate = this.getDelegate(resource);
    await this.getDeletedOrThrow(resource, id);

    if (resource === 'products') {
      await this.restoreProduct(id);
      const restoredProduct = await delegate.findUnique({
        where: { id },
        include: config.include,
      });
      return {
        message: 'Item restored',
        data: config.toItem(restoredProduct),
      };
    }

    const data: Record<string, unknown> = {
      is_deleted: false,
      deleted_at: null,
    };
    if (config.updatedAt) data.updated_at = new Date();

    const restored = await delegate.update({
      where: { id },
      data,
      include: config.include,
    });

    return {
      message: 'Item restored',
      data: config.toItem(restored),
    };
  }

  async approveProductRestoreRequest(requestId: number, adminId?: number) {
    const request = await this.getPendingProductRestoreRequestOrThrow(requestId);
    await this.getDeletedOrThrow('products', request.target_id);
    await this.restoreProduct(request.target_id);
    await this.updateProductRestoreRequestStatus(request, 'approved', adminId);

    return {
      message: 'Product restore request approved',
      data: { id: request.id, product_id: request.target_id },
    };
  }

  async rejectProductRestoreRequest(requestId: number, adminId?: number) {
    const request = await this.getPendingProductRestoreRequestOrThrow(requestId);
    await this.updateProductRestoreRequestStatus(request, 'rejected', adminId);

    return {
      message: 'Product restore request rejected',
      data: { id: request.id, product_id: request.target_id },
    };
  }

  async permanentlyDelete(resource: TrashResource, id: number) {
    const delegate = this.getDelegate(resource);
    await this.getDeletedOrThrow(resource, id);
    if (resource === 'products') {
      await this.permanentlyDeleteProduct(id);
      return {
        message: 'Item permanently deleted',
        data: { resource, id },
      };
    }

    if (resource === 'messages') {
      await this.permanentlyDeleteMessage(id);
      return {
        message: 'Item permanently deleted',
        data: { resource, id },
      };
    }

    await delegate.delete({ where: { id } });

    return {
      message: 'Item permanently deleted',
      data: { resource, id },
    };
  }

  private getResourceKeys(): TrashResource[] {
    return Object.keys(this.configs) as TrashResource[];
  }

  private getConfig(resource: TrashResource) {
    const config = this.configs[resource];
    if (!config) {
      throw new BadRequestException(`Unsupported trash resource: ${resource}`);
    }
    return config;
  }

  private getDelegate(resource: TrashResource) {
    const config = this.getConfig(resource);
    return (this.prisma as any)[config.delegate];
  }

  private buildWhere(resource: TrashResource, search?: string) {
    const trimmedSearch = search?.trim();
    const where: Record<string, unknown> = { is_deleted: true };
    if (!trimmedSearch) return where;

    const config = this.getConfig(resource);
    const searchWhere = config.buildSearchWhere(trimmedSearch);
    const numericId = Number(trimmedSearch);
    const idWhere = Number.isInteger(numericId) ? [{ id: numericId }] : [];
    const searchOr = [
      ...idWhere,
      ...((searchWhere.OR as Record<string, unknown>[]) || []),
    ];

    return {
      ...where,
      OR: searchOr,
    };
  }

  private async getDeletedOrThrow(resource: TrashResource, id: number) {
    const delegate = this.getDelegate(resource);
    const record = await delegate.findFirst({
      where: { id, is_deleted: true },
    });

    if (!record) {
      throw new NotFoundException(
        `Deleted item not found in resource: ${resource}`,
      );
    }

    return record;
  }

  private parseRestoreRequestReason(reason?: string | null) {
    if (!reason) return null;
    try {
      return JSON.parse(reason) as ProductRestoreRequestReason;
    } catch {
      return null;
    }
  }

  private async getPendingProductRestoreRequestOrThrow(requestId: number) {
    const request = await this.prisma.moderation_logs.findFirst({
      where: {
        id: requestId,
        target_type: 'product',
        action: 'restore_requested',
      },
    });

    const reason = this.parseRestoreRequestReason(request?.reason);
    if (!request || reason?.status !== 'pending') {
      throw new NotFoundException('Pending product restore request not found');
    }

    return request;
  }

  private async updateProductRestoreRequestStatus(
    request: { id: number; reason: string | null },
    status: 'approved' | 'rejected',
    adminId?: number,
  ) {
    const reason = this.parseRestoreRequestReason(request.reason) || {};
    const timestampKey =
      status === 'approved' ? 'approved_at' : 'rejected_at';

    await this.prisma.moderation_logs.update({
      where: { id: request.id },
      data: {
        reason: JSON.stringify({
          ...reason,
          status,
          [timestampKey]: new Date().toISOString(),
          admin_id: adminId ?? null,
        }),
      },
    });
  }

  private async restoreProduct(id: number) {
    const restoredAt = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.products.update({
        where: { id },
        data: {
          is_deleted: false,
          deleted_at: null,
          updated_at: restoredAt,
        },
      });
      await tx.product_variants.updateMany({
        where: { product_id: id, is_deleted: true },
        data: {
          is_deleted: false,
          deleted_at: null,
          updated_at: restoredAt,
        },
      });
    });
  }

  private async permanentlyDeleteProduct(id: number) {
    await this.prisma.$transaction(async (tx) => {
      await tx.product_categories.deleteMany({ where: { product_id: id } });
      await tx.product_media.deleteMany({ where: { product_id: id } });
      await tx.cart_items.deleteMany({ where: { product_id: id } });
      await tx.wishlists.deleteMany({ where: { product_id: id } });
      await tx.reviews.deleteMany({ where: { product_id: id } });
      await tx.product_variants.deleteMany({ where: { product_id: id } });
      await tx.products.delete({ where: { id } });
    });
  }

  private async permanentlyDeleteMessage(id: number) {
    await this.prisma.messages.updateMany({
      where: { reply_to_id: id },
      data: { reply_to_id: null },
    });
    await this.prisma.message_reads.deleteMany({
      where: { message_id: id },
    });
    await this.prisma.messages.delete({
      where: { id },
    });
  }
}
