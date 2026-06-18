// prisma/seed.ts
import { PrismaClient, skin_type } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/vi';
import * as fs from 'fs';
import * as path from 'path';
import { Role, RolePermissions } from '../src/auth/constants/Role.enum';
import { Permission } from '../src/auth/constants/Permission.enum';

// Đọc .env thủ công để không phụ thuộc package dotenv
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.substring(0, idx).trim();
    const value = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnv();

const prisma = new PrismaClient();

// Dùng S3 hay local — đọc từ .env, không cần sửa code
const USE_S3 = process.env.USE_S3 === 'true';

// Hàm lấy một phần tử ngẫu nhiên từ mảng
function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Danh sách ảnh sản phẩm local (trong uploads/products/)
const LOCAL_PRODUCT_IMAGES = [
  '/uploads/products/super-stay-full-coverage-foundation.jpg',
  '/uploads/products/super-stay-full-coverage-foundation_1.jpg',
  '/uploads/products/color-sensational-ultimatte-slim-lipstick-makeup.jpg',
  '/uploads/products/tattoo-brow-pigmented-pencil.jpg',
  '/uploads/products/lash-sensational-sky-high-waterproof-mascara.jpg',
  '/uploads/products/lash-sensational-sky-high-waterproof-mascara_1.jpg',
  '/uploads/products/son-min-muot-color-riche-satin.jpg',
  '/uploads/products/kem-nen-kiem-dau-lau-troi-24h-infallible-matte-cover.jpg',
  '/uploads/products/but-ke-mat-lau-troi-l-oreal-paris-flash-cat-eye-by-superliner.jpg',
  '/uploads/products/but-ke-mat-lau-troi-l-oreal-paris-flash-cat-eye-by-superliner_1.jpg',
  '/uploads/products/velvet-soft-matte-chiffon-signature.jpg',
  '/uploads/products/mascara-l-oreal-lam-cong-va-day-mi-curl-impact-collagene.jpg',
  '/uploads/products/les-tarots-de-chanel-phan-ma-hong-hieu-ung-min-li.jpg',
  '/uploads/products/joues-contraste-intense-ma-hong-dang-kem-phan.jpg',
  '/uploads/products/joues-contraste-intense-ma-hong-dang-kem-phan_1.jpg',
  '/uploads/products/sublimage-lessence-de-teint-cushion-foundation.jpg',
  '/uploads/products/rouge-allure-velvet-son-moi.jpg',
  '/uploads/products/rouge-allure-lextrait-mau-sac-ca-tinh.jpg',
  '/uploads/products/rouge-allure-velvet-les-perles-phien-ban-gioi-han.jpg',
  '/uploads/products/rouge-allure-velvet-nuit-blanche-phien-ban-gioi-han.jpg',
  '/uploads/products/rouge-coco-bloom-son-moi-duong-am.jpg',
  '/uploads/products/rouge-coco-flash-sac-son-cang-bong.jpg',
  '/uploads/products/inimitable-extreme-mascara-dinh-hinh-mi-va-chong-lem.jpg',
  '/uploads/products/le-volume-stretch-extreme-mascara-lam-cong-va-dai-mi-chong-lem.jpg',
];

// Hàm sinh URL ảnh faker sản phẩm theo môi trường
function getFakerProductImage(): string {
  if (USE_S3) {
    return faker.image.urlLoremFlickr({ category: 'beauty', width: 640, height: 480 });
  }
  return getRandomElement(LOCAL_PRODUCT_IMAGES);
}

async function main() {
  console.log('Bắt đầu seeding...');

  // --- 1. Dọn dẹp DB ---
  console.log('Dọn dẹp DB...');
  await prisma.message_media.deleteMany({});
  await prisma.message_reactions.deleteMany({});
  await prisma.message_reads.deleteMany({});
  await prisma.messages.deleteMany({});
  await prisma.conversation_participants.deleteMany({});
  await prisma.conversations.deleteMany({});

  await prisma.order_coupons.deleteMany({});
  await prisma.shipments.deleteMany({});
  await prisma.payments.deleteMany({});
  await prisma.order_items.deleteMany({});
  await prisma.orders.deleteMany({});
  await prisma.coupons.deleteMany({});

  await prisma.cart_items.deleteMany({});
  await prisma.carts.deleteMany({});

  await prisma.wishlists.deleteMany({});
  await prisma.reviews.deleteMany({});
  await prisma.tryon_items.deleteMany({});
  await prisma.product_categories.deleteMany({});
  await prisma.product_media.deleteMany({});
  await prisma.product_variants.deleteMany({});
  await prisma.products.deleteMany({});

  await prisma.recommendations.deleteMany({});
  await prisma.tryon_sessions.deleteMany({});
  await prisma.skin_analyses.deleteMany({});

  await prisma.audit_logs.deleteMany({});
  await prisma.notifications.deleteMany({});
  await prisma.moderation_logs.deleteMany({});

  await prisma.categories.deleteMany({});
  await prisma.brands.deleteMany({});

  await prisma.shop_staffs.deleteMany({});
  await prisma.shops.deleteMany({});

  await prisma.addresses.deleteMany({});
  await prisma.auth_identities.deleteMany({});

  await prisma.userpermission.deleteMany({});
  await prisma.rolepermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.users.deleteMany({});

  // --- 2. Tạo Roles ---
  console.log('Tạo roles...');
  const rolesMap = new Map<Role, number>();
  for (const roleName of Object.values(Role)) {
    const role = await prisma.role.create({
      data: { name: roleName },
    });
    rolesMap.set(roleName, role.id);
  }

  // --- 3. Tạo Permissions ---
  console.log('Tạo permissions...');
  const permissionsMap = new Map<Permission, number>();
  for (const permName of Object.values(Permission)) {
    // Sử dụng upsert để tránh lỗi nếu chạy lại mà không xóa
    const perm = await prisma.permission.upsert({
      where: { name: permName },
      update: {},
      create: { name: permName },
    });
    permissionsMap.set(permName, perm.id);
  }

  // --- 4. Map Permissions to Roles (RolePermission) ---
  console.log('Mapping permissions to roles...');
  for (const role of Object.keys(RolePermissions) as Role[]) {
    const roleId = rolesMap.get(role);
    if (!roleId) continue;

    const perms = RolePermissions[role];
    for (const perm of perms) {
      const permId = permissionsMap.get(perm);
      if (!permId) {
        console.warn(`Permission ${perm} not found in map for role ${role}`);
        continue;
      }

      await prisma.rolepermission.create({
        data: {
          role_id: roleId,
          permission_id: permId,
        },
      });
    }
  }

  // --- 5. Tạo Users (Sellers + Admin) ---
  console.log('Tạo users...');
  const adminRoleId = rolesMap.get(Role.ADMIN);
  const sellerRoleId = rolesMap.get(Role.SELLER);
  const userRoleId = rolesMap.get(Role.USER);

  if (!adminRoleId || !sellerRoleId || !userRoleId) {
    throw new Error('Không tìm thấy role ID cần thiết');
  }

  // Tạo Admin
  const adminUser = await prisma.users.create({
    data: {
      email: 'admin@system.com',
      password_hash: 'hashed_password',
      full_name: 'Super Admin',
      role_id: adminRoleId,
    },
  });

  // Tạo 4 Seller (Owner 4 shop - khớp với data-init)
  const seller1 = await prisma.users.create({
    data: {
      email: 'owner1@shop.com',
      password_hash: 'hashed_password',
      full_name: 'BeautyShop Owner',
      role_id: sellerRoleId,
    },
  });

  const seller2 = await prisma.users.create({
    data: {
      email: 'owner2@shop.com',
      password_hash: 'hashed_password',
      full_name: 'SkincareShop Owner',
      role_id: sellerRoleId,
    },
  });

  const seller3 = await prisma.users.create({
    data: {
      email: 'owner3@shop.com',
      password_hash: 'hashed_password',
      full_name: 'MakeupShop Owner',
      role_id: sellerRoleId,
    },
  });

  const seller4 = await prisma.users.create({
    data: {
      email: 'owner4@shop.com',
      password_hash: 'hashed_password',
      full_name: 'CosmeticShop Owner',
      role_id: sellerRoleId,
    },
  });

  // Tạo 10 User thường để test social features
  console.log('Tạo regular users...');
  const regularUsers: any[] = [];
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.users.create({
      data: {
        email: `user${i}@test.com`,
        password_hash: 'hashed_password',
        full_name: faker.person.fullName(),
        avatar_url: faker.image.avatar(),
        phone: faker.phone.number(),
        bio: faker.lorem.sentence(),
        role_id: userRoleId,
        firstlogin: false,
      },
    });
    regularUsers.push(user);
  }

  const allUsers = [adminUser, seller1, seller2, ...regularUsers];

  // --- 6. Tạo UserPermissions (Gán full permission của role cho user cụ thể) ---
  // Yêu cầu: "thêm các userpermission cho hai shop và 1 admin"
  console.log('Tạo UserPermissions...');

  const assignPermissionsToUser = async (userId: number, role: Role) => {
    const perms = RolePermissions[role];
    for (const perm of perms) {
      const permId = permissionsMap.get(perm);
      if (permId) {
        await prisma.userpermission.create({
          data: {
            user_id: userId,
            permission_id: permId,
          },
        });
      }
    }
  };

  await assignPermissionsToUser(adminUser.id, Role.ADMIN);
  await assignPermissionsToUser(seller1.id, Role.SELLER);
  await assignPermissionsToUser(seller2.id, Role.SELLER);
  await assignPermissionsToUser(seller3.id, Role.SELLER);
  await assignPermissionsToUser(seller4.id, Role.SELLER);


  // --- 7. Tạo Shops (4 shops khớp với data-init) ---
  console.log('Tạo shops...');
  const shop1 = await prisma.shops.create({
    data: {
      owner_id: seller1.id,
      name: 'BeautyShop',
      slug: 'beautyshop',
      description: 'Cửa hàng BeautyShop',
      is_verified: true,
    },
  });

  const shop2 = await prisma.shops.create({
    data: {
      owner_id: seller2.id,
      name: 'SkincareShop',
      slug: 'skincareshop',
      description: 'Cửa hàng SkincareShop',
      is_verified: true,
    },
  });

  const shop3 = await prisma.shops.create({
    data: {
      owner_id: seller3.id,
      name: 'MakeupShop',
      slug: 'makeupshop',
      description: 'Cửa hàng MakeupShop',
      is_verified: true,
    },
  });

  const shop4 = await prisma.shops.create({
    data: {
      owner_id: seller4.id,
      name: 'CosmeticShop',
      slug: 'cosmeticshop',
      description: 'Cửa hàng CosmeticShop',
      is_verified: true,
    },
  });
  const shops = [shop1, shop2, shop3, shop4];

  // --- 8. Tạo Brands từ brands.json (khớp ID với products.json) ---
  console.log('Tạo brands...');
  const brandsFilePath = path.join(__dirname, '..', 'src', 'data-init', 'brands.json');
  const brandsDataRaw = fs.readFileSync(brandsFilePath, 'utf8');
  const brandsData: { id: number; name: string; slug?: string; logo_url?: string }[] = JSON.parse(brandsDataRaw);
  const brands: any[] = [];
  for (const brandData of brandsData) {
    const brand = await prisma.brands.create({
      data: {
        name: brandData.name,
        slug: brandData.slug || faker.helpers.slugify(brandData.name).toLowerCase(),
        logo_url: brandData.logo_url || null,
      },
    });
    brands.push(brand);
  }

  // --- 9. Tạo Categories ---
  console.log('Tạo categories...');

  const categoryFilePath = path.join(__dirname, '..', 'src', 'data-init', 'categorys.json');
  const categoryDataRaw = fs.readFileSync(categoryFilePath, 'utf8');
  const categoryData = JSON.parse(categoryDataRaw);

  const allCategories: any[] = [];

  for (const parentCategory of categoryData) {
    const createdParent = await prisma.categories.create({
      data: {
        name: parentCategory.name,
        slug: parentCategory.slug,
        parent_id: null,
      },
    });

    allCategories.push(createdParent);

    if (parentCategory.children && Array.isArray(parentCategory.children)) {
      for (const childCategory of parentCategory.children) {
        const createdChild = await prisma.categories.create({
          data: {
            name: childCategory.name,
            slug: childCategory.slug,
            parent_id: createdParent.id,
          },
        });
        allCategories.push(createdChild);
      }
    }
  }

  // --- 10. Tạo Products từ products.json ---
  console.log('Tạo sản phẩm từ products.json...');
  const productsFilePath = path.join(__dirname, '..', 'src', 'data-init', 'products.json');
  const productsDataRaw = fs.readFileSync(productsFilePath, 'utf8');
  const productsData = JSON.parse(productsDataRaw);

  if (Array.isArray(productsData)) {
    for (const productData of productsData) {
      try {
        const product = await prisma.products.create({
          data: {
            name: productData.name,
            slug: productData.slug,
            description: productData.description,
            how_to_use: productData.how_to_use,
            is_published: productData.is_published,
            moderation_status: productData.moderation_status,
            avg_rating: productData.avg_rating,
            review_count: productData.review_count,
            brand_id: productData.brand_id,
            shop_id: productData.shop_id,
            created_at: new Date(),
          },
        });

        if (productData.category_id) {
          await prisma.product_categories.create({
            data: {
              product_id: product.id,
              category_id: productData.category_id,
            },
          });
        }

        if (productData.variants && Array.isArray(productData.variants)) {
          for (const variantData of productData.variants) {
            await prisma.product_variants.create({
              data: {
                product_id: product.id,
                name: variantData.name,
                price: variantData.price,
                compare_at_price: variantData.compare_price,
                sku: variantData.sku,
                stock: variantData.stock_quantity,
                is_active: true,
                shade_hex: variantData.shade_hex || null,
                created_at: new Date(),
                weight: variantData.weight,
                length: variantData.length,
                width: variantData.width,
                height: variantData.height,
              },
            });
          }
        }

        if (productData.media && Array.isArray(productData.media)) {
          for (const mediaData of productData.media) {
            await prisma.product_media.create({
              data: {
                product_id: product.id,
                url: mediaData.url,
                type: mediaData.type,
                sort_order: mediaData.is_primary ? 0 : 1,
                created_at: new Date(),
              },
            });
          }
        }
      } catch (error) {
        console.log(`Lỗi tạo sản phẩm ${productData.name}:`, error);
      }
    }
  }

  // --- 11. Tạo 100 sản phẩm faker ---
  console.log('Tạo 100 sản phẩm faker bổ sung...');
  for (let i = 0; i < 100; i++) {
    const randomShop = getRandomElement(shops);
    const randomBrand = getRandomElement(brands);
    const randomCategory = getRandomElement(allCategories);
    const productName = faker.commerce.productName();

    await prisma.products.create({
      data: {
        shop_id: randomShop.id,
        brand_id: randomBrand.id,
        name: productName,
        slug: faker.helpers.slugify(productName).toLowerCase() + '-' + faker.string.uuid(),
        description: faker.commerce.productDescription(),
        how_to_use: faker.lorem.paragraph(),
        is_published: true,
        avg_rating: faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }),
        review_count: faker.number.int({ min: 5, max: 200 }),

        product_media: {
          create: [
            {
              url: getFakerProductImage(),
              type: 'image',
              sort_order: 0,
            },
            {
              url: getFakerProductImage(),
              type: 'image',
              sort_order: 1,
            },
          ],
        },

        product_variants: {
          create: [
            {
              sku: `SKU-${faker.string.alphanumeric(10).toUpperCase()}`,
              name: 'Màu 01 / Size M',
              price: faker.number.int({ min: 100000, max: 1000000 }),
              stock: faker.number.int({ min: 10, max: 100 }),
              shade_hex: faker.helpers.maybe(() => faker.color.rgb(), { probability: 0.5 }) || null,
            },
            {
              sku: `SKU-${faker.string.alphanumeric(10).toUpperCase()}`,
              name: 'Màu 02 / Size L',
              price: faker.number.int({ min: 100000, max: 1000000 }),
              stock: faker.number.int({ min: 10, max: 100 }),
              shade_hex: faker.helpers.maybe(() => faker.color.rgb(), { probability: 0.5 }) || null,
            },
          ],
        },

        product_categories: {
          create: [
            {
              category_id: randomCategory.id,
            },
          ],
        },
      },
    });
  }

  // --- 12. Tạo Posts để test moderation ---
  // --- 13. Tạo Reviews ---
  console.log('Tạo product reviews...');
  const allProducts = await prisma.products.findMany({ take: 20 });
  for (let i = 0; i < 50; i++) {
    const randomUser = getRandomElement(regularUsers);
    const randomProduct = getRandomElement(allProducts);

    await prisma.reviews.create({
      data: {
        user_id: randomUser.id,
        product_id: randomProduct.id,
        rating: faker.number.int({ min: 3, max: 5 }),
        content: faker.lorem.paragraph(),
      },
    }).catch(() => { }); // Ignore duplicates (user can only review product once)
  }

  // --- 14. Tạo Addresses ---
  console.log('Tạo addresses...');
  for (const user of regularUsers) {
    const addressCount = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < addressCount; i++) {
      await prisma.addresses.create({
        data: {
          user_id: user.id,
          label: faker.helpers.arrayElement(['Nhà', 'Công ty', 'Khác']),
          recipient: user.full_name,
          phone: user.phone || faker.phone.number(),
          province: 'Hồ Chí Minh',
          district: faker.location.county(),
          ward: faker.location.streetAddress(),
          street: faker.location.street(),
          is_default: i === 0,
        },
      });
    }
  }

  // --- 15. Tạo Shop Addresses từ shop_addresses.json ---
  console.log('Tạo shop addresses...');
  const shopAddressesFilePath = path.join(__dirname, '..', 'src', 'data-init', 'shop_addresses.json');
  const shopAddressesDataRaw = fs.readFileSync(shopAddressesFilePath, 'utf8');
  const shopAddressesData: any[] = JSON.parse(shopAddressesDataRaw);
  for (const sa of shopAddressesData) {
    await prisma.shop_addresses.create({
      data: {
        shop_id: sa.shop_id,
        name: sa.name,
        phone: sa.phone,
        email: sa.email ?? null,
        province: sa.province,
        district: sa.district,
        ward: sa.ward,
        street: sa.street,
        is_default: sa.is_default ?? false,
        ghn_province_id: sa.ghn_province_id ?? null,
        ghn_district_id: sa.ghn_district_id ?? null,
        ghn_ward_code: sa.ghn_ward_code ?? null,
      },
    });
  }

  console.log('Seeding hoàn tất!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });