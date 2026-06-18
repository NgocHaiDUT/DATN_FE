import { ResponseMessages } from '../common/constants/messages.constant';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getFileUrl } from './config/local-multer.config';
@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async updatefullname(
    userId: number,
    fullName: string,
  ): Promise<{ message: string }> {
    await this.prisma.users.update({
      where: { id: userId },
      data: { full_name: fullName },
    });
    return { message: ResponseMessages.PROFILE.NAME_UPDATE_SUCCESS };
  }

  async updateavatar(
    userId: number,
    avatarUrl: string,
  ): Promise<{ message: string; avatarUrl: string }> {
    // Convert filename to proper URL path for local storage
    const properAvatarUrl = getFileUrl(avatarUrl, 'avatars') ?? avatarUrl;

    await this.prisma.users.update({
      where: { id: userId },
      data: { avatar_url: properAvatarUrl },
    });
    return {
      message: ResponseMessages.PROFILE.AVATAR_UPDATE_SUCCESS,
      avatarUrl: properAvatarUrl,
    };
  }

  async updatephone(
    userId: number,
    phone: string,
  ): Promise<{ message: string }> {
    await this.prisma.users.update({
      where: { id: userId },
      data: { phone: phone },
    });
    return { message: ResponseMessages.PROFILE.PHONE_UPDATE_SUCCESS };
  }

  async updateBio(userId: number, bio: string): Promise<{ message: string }> {
    await this.prisma.users.update({
      where: { id: userId },
      data: { bio },
    });
    return { message: ResponseMessages.PROFILE.STORY_UPDATE_SUCCESS };
  }

  async addaddress(
    userid: number,
    label: string,
    receiver_name: string,
    phone: string,
    province: string,
    district: string,
    ward: string,
    street: string,
    is_default: boolean,
  ) {
    await this.prisma.addresses.create({
      data: {
        user_id: userid,
        label: label,
        recipient: receiver_name,
        phone: phone,
        province: province,
        district: district,
        ward: ward,
        street: street,
        is_default: is_default,
      },
    });
    return { message: ResponseMessages.ADDRESS.CREATE_SUCCESS };
  }

  async updateaddress(
    addressid: number,
    label: string,
    receiver_name: string,
    phone: string,
    province: string,
    district: string,
    ward: string,
    street: string,
    is_default: boolean,
  ) {
    await this.prisma.addresses.update({
      where: { id: addressid },
      data: {
        label: label,
        recipient: receiver_name,
        phone: phone,
        province: province,
        district: district,
        ward: ward,
        street: street,
        is_default: is_default,
      },
    });
    return { message: ResponseMessages.ADDRESS.UPDATE_SUCCESS };
  }

  async deleteaddress(addressid: number) {
    await this.prisma.addresses.delete({
      where: { id: addressid },
    });
    return { message: ResponseMessages.ADDRESS.DELETE_SUCCESS };
  }

  async getaddresses(userid: number) {
    return this.prisma.addresses.findMany({
      where: { user_id: userid },
    });
  }

  async createshop(
    userid: number,
    shop_name: string,
    slug: string,
    description: string,
    avatar_url: string,
    banner_url: string,
    phone: string,
    email: string,
  ) {
    const createShopPermission = await this.prisma.permission.findUnique({
      where: { name: 'create_shop' },
      select: { id: true },
    });
    if (!createShopPermission) {
      return { message: ResponseMessages.SHOP_OPS.CREATE_PERMISSION_NOT_FOUND };
    }

    //     const hasCreateShopPermission = await this.prisma.userpermission.findFirst({
    //         where: { user_id: userid, permission_id: createShopPermission.id },
    //         select: { user_id: true },
    //     });
    //     if (!hasCreateShopPermission) {
    //         return { message: 'Bạn không có quyền tạo cửa hàng' };
    //     }

    //     const existingShop = await this.prisma.shops.findFirst({ where: { owner_id: userid } });
    //     if (existingShop) {
    //         return { message: ResponseMessages.SHOP_OPS.ALREADY_HAS_SHOP };
    //     }

    //     const sellerRole = await this.prisma.role.findUnique({
    //         where: { name: 'seller' },
    //         include: {
    //             rolePermissions: { select: { permission_id: true } },
    //         },
    //     });
    //     if (!sellerRole) {
    //         return { message: ResponseMessages.SHOP_OPS.SELLER_ROLE_NOT_FOUND };
    //     }

    //     await this.prisma.$transaction(async (tx) => {
    //         await tx.shops.create({
    //             data: {
    //                 owner_id: userid,
    //                 name: shop_name,
    //                 slug: slug,
    //                 description: description,
    //                 logo_url: avatar_url,
    //                 phone: phone,
    //                 email: email,
    //                 cover_url: banner_url,
    //                 is_verified: false,
    //             },
    //         });

    //         await tx.users.update({ where: { id: userid }, data: { role_id: sellerRole.id } });

    //         if (sellerRole.rolePermissions?.length) {
    //             await tx.userpermission.createMany({
    //                 data: sellerRole.rolePermissions.map((rp) => ({
    //                     user_id: userid,
    //                     permission_id: rp.permission_id,
    //                 })),
    //                 skipDuplicates: true,
    //             });
    //         }

    //         await tx.userpermission.deleteMany({
    //             where: { user_id: userid, permission_id: createShopPermission.id },
    //         });
    //     });

    //     return { message: ResponseMessages.SHOP_OPS.CREATE_SUCCESS };
  }

  async createshop_temp(
    userid: number,
    shop_name: string,
    slug: string,
    description: string,
    avatar_url: string,
    banner_url: string,
    phone: string,
    email: string,
  ) {
    const existingShop = await this.prisma.shops.findFirst({
      where: { owner_id: userid },
    });
    if (existingShop) {
      return { message: ResponseMessages.SHOP_OPS.ALREADY_HAS_SHOP };
    }

    const sellerRole = await this.prisma.role.findUnique({
      where: { name: 'seller' },
      include: {
        rolePermissions: { select: { permission_id: true } },
      },
    });
    if (!sellerRole) {
      return { message: ResponseMessages.SHOP_OPS.SELLER_ROLE_NOT_FOUND };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.shops.create({
        data: {
          owner_id: userid,
          name: shop_name,
          slug: slug,
          description: description,
          logo_url: avatar_url,
          phone: phone,
          email: email,
          cover_url: banner_url,
          is_verified: false,
        },
      });

      await tx.users.update({
        where: { id: userid },
        data: { role_id: sellerRole.id },
      });

      if (sellerRole.rolePermissions?.length) {
        await tx.userpermission.createMany({
          data: sellerRole.rolePermissions.map((rp) => ({
            user_id: userid,
            permission_id: rp.permission_id,
          })),
          skipDuplicates: true,
        });
      }
    });

    return { message: ResponseMessages.SHOP_OPS.CREATE_SUCCESS };
  }

  async getshopbyuserid(userid: number) {
    console.log('🔍 [getshopbyuserid] Looking for shop for user:', userid);

    const ownedShop = await this.prisma.shops.findFirst({
      where: { owner_id: userid },
    });

    console.log('🔍 [getshopbyuserid] Owned shop result:', ownedShop);

    if (ownedShop) {
      return ownedShop;
    }

    const staffShop = await this.prisma.shop_staffs.findFirst({
      where: { user_id: userid },
      include: {
        shop: true,
      },
    });

    console.log('🔍 [getshopbyuserid] Staff shop result:', staffShop);

    if (staffShop) {
      return staffShop.shop;
    }

    console.log('⚠️ [getshopbyuserid] No shop found for user:', userid);
    return null;
  }

  async getPermissionbyuserid(userid: number) {
    const perms = await this.prisma.userpermission.findMany({
      where: { user_id: userid },
      include: { permission: { select: { name: true } } },
    });

    if (!perms || perms.length === 0) {
      return [] as string[];
    }

    const names = perms
      .map((p) => p.permission?.name)
      .filter((n): n is string => typeof n === 'string' && n.length > 0);

    return names;
  }

  async updatelogoshop(userid: number, shopid: number, logo_url: string) {
    await this.prisma.shops.update({
      where: { id: shopid },
      data: { logo_url: logo_url },
    });
    return { message: ResponseMessages.SHOP_OPS.LOGO_UPDATE_SUCCESS };
  }

  async updatebannershop(userid: number, shopid: number, banner_url: string) {
    const shop = await this.prisma.shops.update({
      where: { id: shopid },
      data: { cover_url: banner_url },
    });
    return {
      message: ResponseMessages.SHOP_OPS.BANNER_UPDATE_SUCCESS,
      cover_url: shop.cover_url,
    };
  }

  async updatephoneshop(userid: number, shopid: number, phone: string) {
    await this.prisma.shops.update({
      where: { id: shopid },
      data: { phone: phone },
    });
    return { message: ResponseMessages.SHOP_OPS.PHONE_UPDATE_SUCCESS };
  }

  async updateemailshop(userid: number, shopid: number, email: string) {
    await this.prisma.shops.update({
      where: { id: shopid },
      data: { email: email },
    });
    return { message: ResponseMessages.SHOP_OPS.EMAIL_UPDATE_SUCCESS };
  }

  async updatedescriptionshop(
    userid: number,
    shopid: number,
    description: string,
  ) {
    await this.prisma.shops.update({
      where: { id: shopid },
      data: { description: description },
    });
    return { message: ResponseMessages.SHOP_OPS.DESCRIPTION_UPDATE_SUCCESS };
  }

  async getUserInfo(userId: number) {
    try {
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          full_name: true,
          email: true,
          avatar_url: true,
          phone: true,
          bio: true,
          created_at: true,
          role_id: true,
        },
      });

      if (!user) {
        return { success: false, message: ResponseMessages.USER.NOT_FOUND };
      }

      return {
        success: true,
        data: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          avatar: user.avatar_url, // ✅ Fix: Map to 'avatar' instead of 'Avatar'
          avatar_url: user.avatar_url, // ✅ Also include raw avatar_url for debugging
          phone: user.phone,
          bio: user.bio,
          created_at: user.created_at,
          role_id: user.role_id,
        },
      };
    } catch (error) {
      console.error('Error getting user info:', error);
      return { success: false, message: ResponseMessages.ERROR };
    }
  }
  async getProfile(userId: number) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });
    return user;
  }
}
