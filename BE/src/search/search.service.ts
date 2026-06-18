import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryDto, SearchType } from './dto/search.dto';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tìm kiếm products
   */
  async searchProducts(query: string, limit: number = 20) {
    const products = await this.prisma.products.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          { is_published: true },
          { is_deleted: false },
          { moderation_status: 'approved' },
        ],
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            logo_url: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        product_media: {
          orderBy: { sort_order: 'asc' },
          take: 1,
        },
        product_variants: {
          where: { is_active: true, is_deleted: false },
          orderBy: { price: 'asc' },
          take: 1,
        },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    return products.map((product) => ({
      type: 'product',
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description?.substring(0, 150) || '',
      avg_rating: product.avg_rating,
      review_count: product.review_count,
      shop: product.shop,
      brand: product.brand,
      image_url: product.product_media[0]?.url || null,
      min_price: product.product_variants[0]?.price || null,
      created_at: product.created_at.toISOString(),
    }));
  }

  /**
   * Tìm kiếm users
   */
  async searchUsers(query: string, limit: number = 20) {
    const users = await this.prisma.users.findMany({
      where: {
        AND: [
          {
            OR: [
              { full_name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
          { is_deleted: false },
        ],
      },
      select: {
        id: true,
        full_name: true,
        avatar_url: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: limit,
    });

    return users.map((user) => ({
      type: 'user',
      id: user.id,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
    }));
  }

  /**
   * Tìm kiếm shops
   */
  async searchShops(query: string, limit: number = 20) {
    const shops = await this.prisma.shops.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          { is_deleted: false },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo_url: true,
        description: true,
        is_verified: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: limit,
    });

    return shops.map((shop) => ({
      type: 'shop',
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      logo_url: shop.logo_url,
      description: shop.description,
      is_verified: shop.is_verified,
    }));
  }

  /**
   * Tìm kiếm tổng hợp
   */
  async searchAll(dto: SearchQueryDto) {
    const { q, type, limit = 20 } = dto;

    if (type) {
      switch (type) {
        case SearchType.PRODUCT:
          return {
            success: true,
            data: {
              results: await this.searchProducts(q, limit),
              total: await this.countProducts(q),
            },
          };
        case SearchType.USER:
          return {
            success: true,
            data: {
              results: await this.searchUsers(q, limit),
              total: await this.countUsers(q),
            },
          };
        case SearchType.SHOP:
          return {
            success: true,
            data: {
              results: await this.searchShops(q, limit),
              total: await this.countShops(q),
            },
          };
      }
    }

    const [products, users, shops] = await Promise.all([
      this.searchProducts(q, Math.floor(limit / 2)),
      this.searchUsers(q, Math.floor(limit / 4)),
      this.searchShops(q, Math.floor(limit / 4)),
    ]);

    return {
      success: true,
      data: {
        products,
        users,
        shops,
        total: {
          products: products.length,
          users: users.length,
          shops: shops.length,
        },
      },
    };
  }

  /**
   * Autocomplete suggestions
   */
  async autocomplete(query: string, limit: number = 5) {
    const [products, shops] = await Promise.all([
      this.prisma.products.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
          is_published: true,
          is_deleted: false,
        },
        select: {
          id: true,
          name: true,
          product_media: {
            orderBy: { sort_order: 'asc' },
            take: 1,
            select: { url: true },
          },
        },
        take: limit,
      }),
      this.prisma.shops.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
          is_deleted: false,
        },
        select: {
          id: true,
          name: true,
          logo_url: true,
        },
        take: limit,
      }),
    ]);

    const suggestions = [
      ...products.map((p) => ({
        type: 'product',
        id: p.id,
        suggestion: p.name,
        image_url: p.product_media[0]?.url || null,
      })),
      ...shops.map((s) => ({
        type: 'shop',
        id: s.id,
        suggestion: s.name,
        image_url: s.logo_url,
      })),
    ];

    return {
      success: true,
      data: {
        suggestions: suggestions.slice(0, limit),
      },
    };
  }

  private async countProducts(query: string): Promise<number> {
    return this.prisma.products.count({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          { is_published: true },
          { is_deleted: false },
          { moderation_status: 'approved' },
        ],
      },
    });
  }

  private async countUsers(query: string): Promise<number> {
    return this.prisma.users.count({
      where: {
        OR: [
          { full_name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
    });
  }

  private async countShops(query: string): Promise<number> {
    return this.prisma.shops.count({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
    });
  }
}
