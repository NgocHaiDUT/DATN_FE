import { ResponseMessages } from '../common/constants/messages.constant';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryService } from 'src/delivery/delivery.service';
@Injectable()
export class ShopService {
  constructor(
    private prisma: PrismaService,
    private deliveryService: DeliveryService,
  ) {}

  async addstaff(
    userid: number,
    emailstaff: string,
    shopid: number,
    is_manager: boolean = false,
  ) {
    // Permission check is handled by @RequirePermissions decorator in controller

    const staff = await this.prisma.users.findUnique({
      where: { email: emailstaff },
      select: { id: true, email: true },
    });

    if (!staff) {
      return {
        success: false,
        message: ResponseMessages.SHOP_STAFF.STAFF_NOT_FOUND,
      };
    }

    const shop = await this.prisma.shops.findUnique({
      where: { id: shopid },
      select: { owner_id: true },
    });

    if (!shop) {
      return {
        success: false,
        message: ResponseMessages.SHOP_STAFF.SHOP_NOT_FOUND,
      };
    }

    const isOwner = shop.owner_id === userid;
    const isManager = await this.prisma.shop_staffs.findFirst({
      where: { shop_id: shopid, user_id: userid, is_manager: true },
      select: { id: true },
    });

    // Allow admin users as well
    const caller = await this.prisma.users.findUnique({
      where: { id: userid },
      select: { role: { select: { name: true } } },
    });

    const isAdmin = caller?.role?.name === 'admin';

    if (!isOwner && !isManager && !isAdmin) {
      return {
        success: false,
        message: ResponseMessages.SHOP_STAFF.NO_PERMISSION,
      };
    }

    const existingStaff = await this.prisma.shop_staffs.findFirst({
      where: { shop_id: shopid, user_id: staff.id },
    });

    if (existingStaff) {
      return {
        success: false,
        message: ResponseMessages.SHOP_STAFF.ALREADY_STAFF,
      };
    }

    const isshopowner = await this.prisma.shops.findUnique({
      where: { owner_id: staff.id },
      select: { owner_id: true },
    });

    // If the target user is an owner of any shop, they cannot be added as staff
    if (isshopowner) {
      return {
        success: false,
        message: ResponseMessages.SHOP_STAFF.CANNOT_ADD_OWNER,
      };
    }

    const staffRole = await this.prisma.role.findUnique({
      where: { name: 'staff' },
      include: {
        rolePermissions: {
          select: { permission_id: true },
        },
      },
    });

    if (!staffRole) {
      return {
        success: false,
        message: ResponseMessages.SHOP_STAFF.ROLE_STAFF_NOT_FOUND,
      };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.shop_staffs.create({
        data: {
          shop_id: shopid,
          user_id: staff.id,
          is_manager: is_manager,
        },
      });

      await tx.users.update({
        where: { id: staff.id },
        data: { role_id: staffRole.id },
      });

      if (staffRole.rolePermissions && staffRole.rolePermissions.length > 0) {
        const data = staffRole.rolePermissions.map((rp) => ({
          user_id: staff.id,
          permission_id: rp.permission_id,
        }));
        await tx.userpermission.createMany({ data, skipDuplicates: true });
      }
    });

    return { success: true, message: ResponseMessages.SHOP_STAFF.ADD_SUCCESS };
  }

  async removestaff(userid: number, staffemail: string, shopid: number) {
    // Permission check is handled by @RequirePermissions decorator in controller

    const shop = await this.prisma.shops.findUnique({
      where: { id: shopid },
      select: { owner_id: true },
    });

    if (!shop) {
      return {
        success: false,
        message: ResponseMessages.SHOP_STAFF.SHOP_NOT_FOUND,
      };
    }

    const staff = await this.prisma.users.findUnique({
      where: { email: staffemail },
      select: { id: true, email: true },
    });

    if (!staff) {
      return {
        success: false,
        message: ResponseMessages.SHOP_STAFF.STAFF_NOT_FOUND,
      };
    }

    if (staff.id === shop.owner_id) {
      return {
        success: false,
        message: ResponseMessages.SHOP_STAFF.CANNOT_REMOVE_OWNER,
      };
    }

    await this.prisma.$transaction(async (tx) => {
      const deleted = await tx.shop_staffs.deleteMany({
        where: { shop_id: shopid, user_id: staff.id },
      });

      if (deleted.count === 0) {
        throw new Error(ResponseMessages.SHOP_STAFF.NOT_IN_SHOP);
      }

      const otherShops = await tx.shop_staffs.findFirst({
        where: { user_id: staff.id },
      });

      if (!otherShops) {
        const userRole = await tx.role.findUnique({
          where: { name: 'user' },
          include: {
            rolePermissions: {
              select: { permission_id: true },
            },
          },
        });

        if (userRole) {
          await tx.users.update({
            where: { id: staff.id },
            data: { role_id: userRole.id },
          });

          await tx.userpermission.deleteMany({
            where: { user_id: staff.id },
          });

          if (userRole.rolePermissions && userRole.rolePermissions.length > 0) {
            const data = userRole.rolePermissions.map((rp) => ({
              user_id: staff.id,
              permission_id: rp.permission_id,
            }));
            await tx.userpermission.createMany({ data, skipDuplicates: true });
          }
        }
      }
    });

    return {
      success: true,
      message: ResponseMessages.SHOP_STAFF.REMOVE_SUCCESS,
    };
  }

  async getstaffs(shopid: number) {
    const staffs = await this.prisma.shop_staffs.findMany({
      where: { shop_id: shopid },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            full_name: true,
            avatar_url: true,
            phone: true,
          },
        },
      },
    });

    return staffs;
  }

  async updatestaffpermission(
    userid: number,
    staffemail: string,
    shopid: number,
    permissionNames: string[],
  ) {
    // Permission check is handled by @RequirePermissions decorator in controller

    const shop = await this.prisma.shops.findUnique({
      where: { id: shopid },
      select: { owner_id: true },
    });

    if (!shop) {
      return {
        success: false,
        message: ResponseMessages.SHOP_STAFF.SHOP_NOT_FOUND,
      };
    }

    const isOwner = shop.owner_id === userid;
    const isManager = await this.prisma.shop_staffs.findFirst({
      where: { shop_id: shopid, user_id: userid, is_manager: true },
      select: { id: true },
    });

    if (!isOwner && !isManager) {
      return {
        success: false,
        message: ResponseMessages.SHOP_STAFF.NO_PERMISSION,
      };
    }

    const staff = await this.prisma.users.findUnique({
      where: { email: staffemail },
      select: { id: true },
    });

    if (!staff) {
      return {
        success: false,
        message: ResponseMessages.SHOP_STAFF.STAFF_NOT_FOUND,
      };
    }

    const staffInShop = await this.prisma.shop_staffs.findFirst({
      where: { shop_id: shopid, user_id: staff.id },
    });

    if (!staffInShop) {
      return {
        success: false,
        message: ResponseMessages.SHOP.STAFF_NOT_IN_SHOP,
      };
    }

    if (staff.id === shop.owner_id) {
      return {
        success: false,
        message: ResponseMessages.SHOP.CANNOT_CHANGE_OWNER_PERM,
      };
    }

    // Validate permissions tồn tại trong database
    const permissions = await this.prisma.permission.findMany({
      where: { name: { in: permissionNames } },
      select: { id: true, name: true },
    });

    if (permissions.length === 0) {
      return { success: false, message: ResponseMessages.SHOP.INVALID_PERM };
    }

    if (permissions.length !== permissionNames.length) {
      const foundNames = permissions.map((p) => p.name);
      const notFound = permissionNames.filter(
        (name) => !foundNames.includes(name),
      );
      return {
        success: false,
        message: `Các quyền không tồn tại: ${notFound.join(', ')}`,
      };
    }

    // Danh sách SHOP permissions (không bao gồm USER permissions)
    const shopPermissionNames = [
      'manage_shop_staff',
      'edit_profile_shop',
      'manage_shop_admin',
      'manage_order',
      'try_on_tester',
      'chat_with_customer',
      'manage_shop_setting',
      'view_dashboard',
      'view_shop_tutorial',
      'manage_product',
      'manage_brands',
      'manage_categorys',
      'manage_shop_address',
    ];

    // Lấy IDs của tất cả SHOP permissions để xóa
    const shopPermissions = await this.prisma.permission.findMany({
      where: { name: { in: shopPermissionNames } },
      select: { id: true },
    });

    const shopPermissionIds = shopPermissions.map((p) => p.id);

    // Thực hiện update trong transaction
    await this.prisma.$transaction(async (tx) => {
      // Xóa TẤT CẢ shop permissions hiện tại của staff
      const deleteResult = await tx.userpermission.deleteMany({
        where: {
          user_id: staff.id,
          permission_id: { in: shopPermissionIds },
        },
      });

      // Thêm permissions mới
      const data = permissions.map((p) => ({
        user_id: staff.id,
        permission_id: p.id,
      }));

      const createResult = await tx.userpermission.createMany({
        data,
        skipDuplicates: true,
      });
    });

    return {
      success: true,
      message: ResponseMessages.SHOP.PERM_UPDATE_SUCCESS,
    };
  }

  async deletestaffpermission(
    userid: number,
    staffemail: string,
    shopid: number,
    permissionNames: string[],
  ) {
    // Permission check is handled by @RequirePermissions decorator in controller

    const shop = await this.prisma.shops.findUnique({
      where: { id: shopid },
      select: { owner_id: true },
    });

    if (!shop) {
      return {
        success: false,
        message: ResponseMessages.SHOP_STAFF.SHOP_NOT_FOUND,
      };
    }

    const isOwner = shop.owner_id === userid;
    const isManager = await this.prisma.shop_staffs.findFirst({
      where: { shop_id: shopid, user_id: userid, is_manager: true },
      select: { id: true },
    });

    if (!isOwner && !isManager) {
      return {
        success: false,
        message: ResponseMessages.SHOP_STAFF.NO_PERMISSION,
      };
    }

    const staff = await this.prisma.users.findUnique({
      where: { email: staffemail },
      select: { id: true },
    });

    if (!staff) {
      return {
        success: false,
        message: ResponseMessages.SHOP_STAFF.STAFF_NOT_FOUND,
      };
    }

    const staffInShop = await this.prisma.shop_staffs.findFirst({
      where: { shop_id: shopid, user_id: staff.id },
    });

    if (!staffInShop) {
      return {
        success: false,
        message: ResponseMessages.SHOP.STAFF_NOT_IN_SHOP,
      };
    }

    if (staff.id === shop.owner_id) {
      return {
        success: false,
        message: ResponseMessages.SHOP.CANNOT_REMOVE_OWNER_PERM,
      };
    }

    const permissions = await this.prisma.permission.findMany({
      where: { name: { in: permissionNames } },
      select: { id: true, name: true },
    });

    if (permissions.length === 0) {
      return { success: false, message: ResponseMessages.SHOP.INVALID_PERM };
    }

    const permissionIds = permissions.map((p) => p.id);

    const deleted = await this.prisma.userpermission.deleteMany({
      where: {
        user_id: staff.id,
        permission_id: { in: permissionIds },
      },
    });

    return {
      success: true,
      message: `Đã xóa ${deleted.count} quyền của nhân viên`,
      deleted_count: deleted.count,
    };
  }

  async getpermissionstaff(shopid: number, staffemail: string) {
    const staff = await this.prisma.users.findUnique({
      where: { email: staffemail },
      select: { id: true },
    });
    if (!staff) {
      return { message: ResponseMessages.SHOP_STAFF.STAFF_NOT_FOUND };
    }

    const staffInShop = await this.prisma.shop_staffs.findFirst({
      where: { shop_id: shopid, user_id: staff.id },
    });

    if (!staffInShop) {
      return {
        success: false,
        message: ResponseMessages.SHOP.STAFF_NOT_IN_SHOP,
      };
    }

    const permission = await this.prisma.userpermission.findMany({
      where: { user_id: staff.id },
      include: { permission: { select: { name: true } } },
    });

    if (!permission || permission.length === 0) {
      return [] as string[];
    }

    const permissionname = permission
      .map((p) => p.permission?.name)
      .filter((n): n is string => typeof n === 'string' && n.length > 0);

    return permissionname;
  }

  async getallpermissionswithstatus(shopid: number, staffemail: string) {
    // Verify staff exists and belongs to shop
    const staff = await this.prisma.users.findUnique({
      where: { email: staffemail },
      select: { id: true },
    });

    if (!staff) {
      throw new NotFoundException(ResponseMessages.SHOP_STAFF.STAFF_NOT_FOUND);
    }

    const staffInShop = await this.prisma.shop_staffs.findFirst({
      where: { shop_id: shopid, user_id: staff.id },
    });

    if (!staffInShop) {
      throw new NotFoundException(ResponseMessages.SHOP.STAFF_NOT_IN_SHOP);
    }

    // Get all available permissions
    const allPermissions = await this.prisma.permission.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    // Get staff's current permissions
    const staffPermissions = await this.prisma.userpermission.findMany({
      where: { user_id: staff.id },
      select: { permission_id: true },
    });

    const staffPermissionIds = new Set(
      staffPermissions.map((sp) => sp.permission_id),
    );

    // Map all permissions with isGranted status
    const permissionsWithStatus = allPermissions.map((permission) => ({
      id: permission.id,
      name: permission.name,
      isGranted: staffPermissionIds.has(permission.id),
    }));

    return permissionsWithStatus;
  }

  async getproduct(shopid: number) {
    const ishasshop = await this.prisma.shops.findUnique({
      where: { id: shopid },
      select: { id: true },
    });
    if (!ishasshop) {
      return { success: false, message: ResponseMessages.SHOP.NOT_FOUND };
    }

    const products = await this.prisma.products.findMany({
      where: {
        shop_id: shopid,
        is_deleted: false,
        is_published: true,
        moderation_status: 'approved',
      },
      include: {
        product_variants: {
          orderBy: {
            price: 'asc',
          },
        },
        product_media: {
          orderBy: {
            sort_order: 'asc',
          },
        },
        brand: true,
        product_categories: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const formattedProducts = products.map((product) => {
      // Calculate price range
      const prices = product.product_variants.map((v) => Number(v.price));
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

      // Get first image
      const firstImage = product.product_media?.[0]?.url || null;

      // Check if has try-on
      const hasTryOn = product.product_variants.some(
        (v) => v.shade_hex !== null && v.shade_hex !== '',
      );

      // Calculate inventory
      const totalInventory = product.product_variants.reduce(
        (sum, v) => sum + v.stock,
        0,
      );

      return {
        ...product,
        price: minPrice, // For simple display
        min_price: minPrice,
        max_price: maxPrice,
        first_image: firstImage,
        image: firstImage, // Alias for some frontend components
        hasTryOn,
        variants_count: product.product_variants.length,
        inventory: totalInventory,
        rating: Number(product.avg_rating) || 0,
        reviews: product.review_count || 0,
      };
    });

    return { success: true, data: formattedProducts };
  }

  async getShopDetails(shopIdentifier: string | number) {
    let where: any = {};
    const id = Number(shopIdentifier);

    if (!isNaN(id)) {
      where = { id: id };
    } else {
      where = { slug: String(shopIdentifier) };
    }

    const shop = await this.prisma.shops.findUnique({
      where: where,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            full_name: true,
            avatar_url: true,
            phone: true,
          },
        },
        shop_staffs: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                full_name: true,
                avatar_url: true,
                phone: true,
                role: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!shop) {
      return { success: false, message: ResponseMessages.SHOP.NOT_FOUND };
    }

    // Get published AND approved products for shop
    const publishedProducts = await this.prisma.products.findMany({
      where: {
        shop_id: shop.id,
        is_published: true,
        moderation_status: 'approved', // Only count approved products
      },
      select: {
        id: true,
        avg_rating: true,
      },
    });

    // Calculate average rating across all products
    const totalRating = publishedProducts.reduce(
      (sum, p) => sum + (p.avg_rating ? Number(p.avg_rating) : 0),
      0,
    );
    const avgShopRating =
      publishedProducts.length > 0 ? totalRating / publishedProducts.length : 0;

    // Get total review count
    const totalReviews = await this.prisma.reviews.count({
      where: {
        product: {
          shop_id: shop.id,
        },
      },
    });

    return {
      success: true,
      data: {
        id: shop.id,
        name: shop.name,
        slug: shop.slug,
        description: shop.description,
        logo_url: shop.logo_url,
        cover_url: shop.cover_url,
        phone: shop.phone,
        email: shop.email,
        is_verified: shop.is_verified,
        commission_rate: Number(shop.commission_rate),
        created_at: shop.created_at,
        updated_at: shop.updated_at,
        owner: shop.owner,
        staffs: shop.shop_staffs.map((staff) => ({
          id: staff.id,
          user_id: staff.user_id,
          is_manager: staff.is_manager,
          created_at: staff.created_at,
          user: {
            id: staff.user.id,
            email: staff.user.email,
            full_name: staff.user.full_name,
            avatar_url: staff.user.avatar_url,
            phone: staff.user.phone,
            role: staff.user.role?.name,
          },
        })),
        staff_count: shop.shop_staffs.length,
        product_count: publishedProducts.length,
        avg_rating: Number(avgShopRating.toFixed(1)),
        total_reviews: totalReviews,
      },
    };
  }

  async getShops(
    page: number = 1,
    limit: number = 10,
    search?: string,
    isVerified?: boolean,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isVerified !== undefined) {
      where.is_verified = isVerified;
    }

    const [shops, total] = await Promise.all([
      this.prisma.shops.findMany({
        where,
        skip,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              full_name: true,
              avatar_url: true,
            },
          },
          _count: {
            select: {
              shop_staffs: true,
              products: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.shops.count({ where }),
    ]);

    return {
      success: true,
      data: shops.map((shop) => ({
        id: shop.id,
        name: shop.name,
        slug: shop.slug,
        description: shop.description,
        logo_url: shop.logo_url,
        cover_url: shop.cover_url,
        phone: shop.phone,
        email: shop.email,
        is_verified: shop.is_verified,
        commission_rate: Number(shop.commission_rate),
        created_at: shop.created_at,
        updated_at: shop.updated_at,
        owner: shop.owner,
        staff_count: shop._count.shop_staffs,
        product_count: shop._count.products,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateCommissionRate(
    userid: number,
    shopid: number,
    commissionRate: number,
  ) {
    if (
      !Number.isFinite(commissionRate) ||
      commissionRate < 0 ||
      commissionRate > 1
    ) {
      throw new BadRequestException(
        'commission_rate phải nằm trong khoảng 0 đến 1',
      );
    }

    const user = await this.prisma.users.findUnique({
      where: { id: userid },
      select: {
        role: {
          select: { name: true },
        },
      },
    });

    if (user?.role?.name !== 'admin') {
      throw new ForbiddenException('Chỉ admin được cập nhật hoa hồng platform');
    }

    const shop = await this.prisma.shops.findUnique({
      where: { id: shopid },
      select: { id: true, name: true },
    });

    if (!shop) {
      throw new NotFoundException(ResponseMessages.SHOP_STAFF.SHOP_NOT_FOUND);
    }

    const updatedShop = await this.prisma.shops.update({
      where: { id: shopid },
      data: {
        commission_rate: commissionRate,
        updated_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        commission_rate: true,
        updated_at: true,
      },
    });

    return {
      success: true,
      message: `Đã cập nhật hoa hồng platform cho shop "${shop.name}"`,
      data: {
        ...updatedShop,
        commission_rate: Number(updatedShop.commission_rate),
      },
    };
  }

  async updateAllCommissionRates(userid: number, commissionRate: number) {
    if (
      !Number.isFinite(commissionRate) ||
      commissionRate < 0 ||
      commissionRate > 1
    ) {
      throw new BadRequestException(
        'commission_rate phai nam trong khoang 0 den 1',
      );
    }

    const user = await this.prisma.users.findUnique({
      where: { id: userid },
      select: {
        role: {
          select: { name: true },
        },
      },
    });

    if (user?.role?.name !== 'admin') {
      throw new ForbiddenException('Chi admin duoc cap nhat hoa hong platform');
    }

    const updateResult = await this.prisma.shops.updateMany({
      data: {
        commission_rate: commissionRate,
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      message: `Da cap nhat hoa hong platform cho ${updateResult.count} shop`,
      data: {
        updated_count: updateResult.count,
        commission_rate: Number(commissionRate),
      },
    };
  }

  async banShop(userid: number, shopid: number) {
    // Check if user is admin
    const user = await this.prisma.users.findUnique({
      where: { id: userid },
      select: {
        role: {
          select: { name: true },
        },
      },
    });

    if (user?.role?.name !== 'admin') {
      return {
        success: false,
        message: ResponseMessages.SHOP.ONLY_ADMIN_BAN,
      };
    }

    // Check if shop exists
    const shop = await this.prisma.shops.findUnique({
      where: { id: shopid },
      select: { id: true, is_verified: true, name: true },
    });

    if (!shop) {
      return {
        success: false,
        message: ResponseMessages.SHOP_STAFF.SHOP_NOT_FOUND,
      };
    }

    // Update shop verification status
    await this.prisma.shops.update({
      where: { id: shopid },
      data: {
        is_verified: false,
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      message: `Shop "${shop.name}" đã bị ban`,
    };
  }

  async unbanShop(userid: number, shopid: number) {
    // Check if user is admin
    const user = await this.prisma.users.findUnique({
      where: { id: userid },
      select: {
        role: {
          select: { name: true },
        },
      },
    });

    if (user?.role?.name !== 'admin') {
      return {
        success: false,
        message: ResponseMessages.SHOP.ONLY_ADMIN_UNBAN,
      };
    }

    // Check if shop exists
    const shop = await this.prisma.shops.findUnique({
      where: { id: shopid },
      select: { id: true, is_verified: true, name: true },
    });

    if (!shop) {
      return {
        success: false,
        message: ResponseMessages.SHOP_STAFF.SHOP_NOT_FOUND,
      };
    }

    // Update shop verification status
    await this.prisma.shops.update({
      where: { id: shopid },
      data: {
        is_verified: true,
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      message: `Shop "${shop.name}" đã được unban`,
    };
  }

  async updateShop(
    userid: number,
    shopid: number,
    updateData: {
      name?: string;
      description?: string;
      logo_url?: string;
      cover_url?: string;
      phone?: string;
      email?: string;
    },
  ) {
    // Check if shop exists
    const shop = await this.prisma.shops.findUnique({
      where: { id: shopid },
      select: { owner_id: true },
    });

    if (!shop) {
      return {
        success: false,
        message: ResponseMessages.SHOP_STAFF.SHOP_NOT_FOUND,
      };
    }

    // Check if user is admin, owner, or manager
    const user = await this.prisma.users.findUnique({
      where: { id: userid },
      select: {
        role: {
          select: { name: true },
        },
      },
    });

    const isAdmin = user?.role?.name === 'admin';
    const isOwner = shop.owner_id === userid;
    const isManager = await this.prisma.shop_staffs.findFirst({
      where: { shop_id: shopid, user_id: userid, is_manager: true },
      select: { id: true },
    });

    if (!isAdmin && !isOwner && !isManager) {
      return {
        success: false,
        message: ResponseMessages.SHOP.NO_EDIT_PERM,
      };
    }

    // Generate slug if name is updated
    let slug: string | undefined;
    if (updateData.name) {
      slug = updateData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      // Check if slug already exists (for other shops)
      const existingShop = await this.prisma.shops.findFirst({
        where: {
          slug,
          NOT: { id: shopid },
        },
      });

      if (existingShop) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    // Update shop
    const updatedShop = await this.prisma.shops.update({
      where: { id: shopid },
      data: {
        ...updateData,
        ...(slug && { slug }),
        updated_at: new Date(),
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            full_name: true,
            avatar_url: true,
          },
        },
      },
    });

    return {
      success: true,
      message: ResponseMessages.SHOP.UPDATE_SUCCESS,
      data: {
        id: updatedShop.id,
        name: updatedShop.name,
        slug: updatedShop.slug,
        description: updatedShop.description,
        logo_url: updatedShop.logo_url,
        cover_url: updatedShop.cover_url,
        phone: updatedShop.phone,
        email: updatedShop.email,
        is_verified: updatedShop.is_verified,
        created_at: updatedShop.created_at,
        updated_at: updatedShop.updated_at,
        owner: updatedShop.owner,
      },
    };
  }

  // Public method - no auth required, limited info
  async getPublicShopDetails(shopid: number, currentUserId?: number) {
    const shop = await this.prisma.shops.findUnique({
      where: { id: shopid },
      include: {
        owner: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true,
          },
        },
        _count: {
          select: {
            shop_staffs: true,
          },
        },
      },
    });

    if (!shop) {
      return { success: false, message: ResponseMessages.SHOP.NOT_FOUND };
    }

    // Get published AND approved products for shop
    const publishedProducts = await this.prisma.products.findMany({
      where: {
        shop_id: shopid,
        is_published: true,
        moderation_status: 'approved',
      },
      select: {
        id: true,
        avg_rating: true,
      },
    });

    // Calculate average rating across all products
    const totalRating = publishedProducts.reduce(
      (sum, p) => sum + (p.avg_rating ? Number(p.avg_rating) : 0),
      0,
    );
    const avgShopRating =
      publishedProducts.length > 0 ? totalRating / publishedProducts.length : 0;

    // Get total review count (only for published products)
    const totalReviews = await this.prisma.reviews.count({
      where: {
        product: {
          shop_id: shopid,
          is_published: true,
        },
      },
    });

    return {
      success: true,
      data: {
        id: shop.id,
        name: shop.name,
        slug: shop.slug,
        description: shop.description,
        logo_url: shop.logo_url,
        cover_url: shop.cover_url,
        phone: shop.phone,
        email: shop.email,
        is_verified: shop.is_verified,
        created_at: shop.created_at,
        updated_at: shop.updated_at,
        owner: shop.owner,
        staff_count: shop._count.shop_staffs,
        product_count: publishedProducts.length,
        avg_rating: Number(avgShopRating.toFixed(1)),
        total_reviews: totalReviews,
      },
    };
  }

  // ============================================
  // PUBLIC METHODS (No authentication required)
  // ============================================

  /**
   * Get shop public profile - No authentication required
   */
  async getShopPublicProfile(shopId: number) {
    const shop = await this.prisma.shops.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logo_url: true,
        cover_url: true,
        phone: true,
        email: true,
        is_verified: true,
        created_at: true,
        _count: {
          select: {
            products: true,
            shop_staffs: true,
          },
        },
      },
    });

    if (!shop) {
      throw new NotFoundException(ResponseMessages.SHOP.NOT_FOUND);
    }

    // TODO: Calculate real rating and response rate from orders/reviews
    const rating = 4.8;
    const responseRate = 99;

    return {
      success: true,
      data: {
        id: shop.id,
        name: shop.name,
        slug: shop.slug,
        description: shop.description,
        logo_url: shop.logo_url,
        cover_url: shop.cover_url,
        phone: shop.phone,
        email: shop.email,
        is_verified: shop.is_verified,
        rating,
        response_rate: responseRate,
        product_count: shop._count.products,
        created_at: shop.created_at,
      },
    };
  }

  /**
   * Get shop products with pagination - No authentication required
   */
  async getShopProducts(shopId: number, query: any) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      order = 'desc',
    } = query;

    // Verify shop exists
    const shop = await this.prisma.shops.findUnique({
      where: { id: shopId },
      select: { id: true },
    });

    if (!shop) {
      throw new NotFoundException(ResponseMessages.SHOP.NOT_FOUND);
    }

    const skip = (page - 1) * limit;

    // Build orderBy object
    const orderByField: any = {};
    orderByField[sortBy] = order;

    // Get products with pagination
    const [products, total] = await Promise.all([
      this.prisma.products.findMany({
        where: {
          shop_id: shopId,
          is_published: true, // ✅ Only show published products
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          avg_rating: true,
          review_count: true,
          created_at: true,
          product_media: {
            select: {
              url: true,
              sort_order: true,
            },
            orderBy: {
              sort_order: 'asc',
            },
            take: 1,
          },
          product_variants: {
            select: {
              price: true,
              compare_at_price: true,
              stock: true,
            },
            orderBy: {
              price: 'asc',
            },
            take: 1,
          },
        },
        orderBy: orderByField,
        skip,
        take: limit,
      }),
      this.prisma.products.count({
        where: {
          shop_id: shopId,
          is_published: true,
        },
      }),
    ]);

    return {
      success: true,
      data: products.map((product) => {
        const variant = product.product_variants[0];
        const soldCount = 0; // TODO: Calculate from orders

        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: variant ? Number(variant.price) : 0,
          discount_price: variant?.compare_at_price
            ? Number(variant.compare_at_price)
            : null,
          stock_quantity: variant?.stock || 0,
          sold_count: soldCount,
          rating: product.avg_rating ? Number(product.avg_rating) : 0,
          review_count: product.review_count,
          image_url: product.product_media[0]?.url || null,
          created_at: product.created_at.toISOString(),
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get shop products for management (shop owner/staff view)
   * Shows ALL products regardless of publication or moderation status
   * Requires authentication and MANAGE_PRODUCT permission
   */
  async getShopProductsForManagement(
    shopId: number,
    userId: number,
    query: any,
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      order = 'desc',
      moderation_status,
      is_published,
      is_deleted,
      search,
      category_id,
      brand_id,
    } = query;

    // Verify shop exists
    const shop = await this.prisma.shops.findUnique({
      where: { id: shopId },
      select: { id: true, owner_id: true },
    });

    if (!shop) {
      throw new NotFoundException(ResponseMessages.SHOP.NOT_FOUND);
    }

    // Check if user is shop owner or staff with manage_product permission
    const isOwner = shop.owner_id === userId;
    const isStaff = await this.prisma.shop_staffs.findFirst({
      where: {
        shop_id: shopId,
        user_id: userId,
      },
    });

    const currentUser = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: { rolePermissions: { include: { permission: true } } },
        },
        userPermissions: { include: { permission: true } },
      },
    });
    const currentUserPermissions = new Set([
      ...(currentUser?.role?.rolePermissions?.map((rp) => rp.permission.name) ||
        []),
      ...(currentUser?.userPermissions?.map((up) => up.permission.name) || []),
    ]);
    const isAdmin =
      currentUser?.role?.name === 'admin' ||
      currentUserPermissions.has('manage_shop_admin') ||
      currentUserPermissions.has('manage_users');

    // Check if staff has manage_product permission
    let hasManageProductPermission =
      currentUserPermissions.has('manage_product');
    if (isStaff && !isOwner) {
      const userPermissions = await this.prisma.userpermission.findMany({
        where: { user_id: userId },
        include: { permission: true },
      });
      hasManageProductPermission =
        hasManageProductPermission ||
        userPermissions.some((up) => up.permission.name === 'manage_product');
    }

    if (!isAdmin && !isOwner && (!isStaff || !hasManageProductPermission)) {
      throw new ForbiddenException(
        'You do not have permission to manage products for this shop',
      );
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      shop_id: shopId,
    };

    // Add optional filters
    if (moderation_status) {
      where.moderation_status = moderation_status;
    }
    if (is_published !== undefined) {
      where.is_published = is_published === 'true' || is_published === true;
    }
    if (is_deleted !== undefined) {
      where.is_deleted = is_deleted === 'true' || is_deleted === true;
    }
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }
    if (brand_id) {
      where.brand_id = parseInt(brand_id);
    }
    if (category_id) {
      // Filter by category using product_categories relation
      where.product_categories = {
        some: {
          category_id: parseInt(category_id),
        },
      };
    }

    // Build orderBy object
    const orderByField: any = {};
    orderByField[sortBy] = order;

    // Get products with pagination
    const [products, total] = await Promise.all([
      this.prisma.products.findMany({
        where,
        select: {
          id: true,
          shop_id: true,
          name: true,
          slug: true,
          description: true,
          avg_rating: true,
          review_count: true,
          is_deleted: true,
          deleted_at: true,
          is_published: true,
          moderation_status: true,
          created_at: true,
          updated_at: true,
          brand_id: true,
          brand: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo_url: true,
            },
          },
          product_categories: {
            select: {
              category_id: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  parent_id: true,
                },
              },
            },
          },
          product_media: {
            select: {
              id: true,
              url: true,
              type: true,
              sort_order: true,
              created_at: true,
            },
            orderBy: {
              sort_order: 'asc',
            },
            take: 10,
          },
          product_variants: {
            select: {
              id: true,
              sku: true,
              name: true,
              price: true,
              compare_at_price: true,
              stock: true,
              shade_hex: true,
              size_label: true,
              opacity: true,
              is_active: true,
              created_at: true,
              updated_at: true,
            },
            orderBy: {
              price: 'asc',
            },
          },
        },
        orderBy: orderByField,
        skip,
        take: limit,
      }),
      this.prisma.products.count({
        where,
      }),
    ]);

    return {
      success: true,
      data: {
        products: products.map((product) => {
          const variant = product.product_variants[0];
          const soldCount = 0; // TODO: Calculate from orders

          return {
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            price: variant ? Number(variant.price) : 0,
            discount_price: variant?.compare_at_price
              ? Number(variant.compare_at_price)
              : null,
            stock_quantity: variant?.stock || 0,
            sold_count: soldCount,
            rating: product.avg_rating ? Number(product.avg_rating) : 0,
            review_count: product.review_count,
            image_url: product.product_media[0]?.url || null,
            is_deleted: product.is_deleted,
            deleted_at: product.deleted_at
              ? product.deleted_at.toISOString()
              : null,
            is_published: product.is_published,
            moderation_status: product.moderation_status,
            created_at: product.created_at.toISOString(),
            updated_at: product.updated_at.toISOString(),
            // Include full relations for frontend
            brand_id: product.brand_id,
            brand: product.brand,
            product_categories: product.product_categories,
            product_variants: product.product_variants,
            product_media: product.product_media,
          };
        }),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }
  // ============================================
  //Create GHN Shop
  /**
   * Register a shop with GHN using an existing shop address
   */
  async registerGHNShop(userId: number, shopId: number, addressShopId: number) {
    // 1. Verify shop existence and ownership/management
    const shop = await this.prisma.shops.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        owner_id: true,
        name: true,
        phone: true,
        email: true,
      },
    });

    if (!shop) {
      throw new NotFoundException(ResponseMessages.SHOP_STAFF.SHOP_NOT_FOUND);
    }

    // Check permissions (Owner, Manager, or Admin)
    const isOwner = shop.owner_id === userId;
    const staff = await this.prisma.shop_staffs.findFirst({
      where: { shop_id: shopId, user_id: userId, is_manager: true },
    });
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { role: { select: { name: true } } },
    });
    const isAdmin = user?.role?.name === 'admin';

    if (!isOwner && !staff && !isAdmin) {
      throw new ForbiddenException(ResponseMessages.SHOP.ACTION_NO_PERM);
    }

    // 2. Fetch the shop address
    const address = await this.prisma.shop_addresses.findFirst({
      where: { id: addressShopId, shop_id: shopId },
    });

    if (!address) {
      throw new NotFoundException(ResponseMessages.SHOP.ADDRESS_NOT_FOUND);
    }

    // 3. Validate GHN location identifiers
    if (!address.ghn_district_id || !address.ghn_ward_code) {
      throw new BadRequestException(
        'Địa chỉ này chưa có thông tin Quận/Huyện hoặc Phường/Xã hợp lệ từ GHN',
      );
    }

    // 4. Call GHN API
    const ghnShopData = {
      district_id: address.ghn_district_id,
      ward_code: address.ghn_ward_code,
      name: shop.name,
      phone: address.phone || shop.phone || '',
      address: `${address.street}, ${address.ward}, ${address.district}, ${address.province}`,
    };

    try {
      const ghnResponse = await this.deliveryService.registerShop(ghnShopData);
      const ghnShopId = ghnResponse.shop_id;

      if (!ghnShopId) {
        throw new BadRequestException(ResponseMessages.SHOP.GHN_SHOP_INVALID);
      }

      // 5. Update local shop with ghn_shop_id
      await this.prisma.shops.update({
        where: { id: shopId },
        data: { ghn_shop_id: ghnShopId },
      });

      return {
        success: true,
        message: ResponseMessages.SHOP.GHN_REGISTER_SUCCESS,
        ghn_shop_id: ghnShopId,
      };
    } catch (error: any) {
      console.error(
        'GHN Registration Error:',
        error.response?.data || error.message,
      );
      throw new BadRequestException(
        error.message || ResponseMessages.SHOP.GHN_REGISTER_ERROR,
      );
    }
  }
}
