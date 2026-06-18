// prisma/seed-coupons.ts
// Chạy: npx ts-node -r tsconfig-paths/register prisma/seed-coupons.ts

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

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

interface CouponData {
  code: string;
  description?: string;
  discount_type: string;
  discount_value: number;
  min_subtotal?: number;
  usage_limit?: number | null;
  starts_at?: string;
  ends_at?: string;
}

async function main() {
  const dataPath = path.join(__dirname, 'coupons-data.json');
  const coupons: CouponData[] = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  console.log(`\nBắt đầu seed ${coupons.length} mã giảm giá...\n`);

  let created = 0;
  let skipped = 0;

  for (const coupon of coupons) {
    const existing = await prisma.coupons.findUnique({
      where: { code: coupon.code.toUpperCase() },
    });

    if (existing) {
      console.log(`  [BỎ QUA] ${coupon.code} — đã tồn tại`);
      skipped++;
      continue;
    }

    await prisma.coupons.create({
      data: {
        code: coupon.code.toUpperCase(),
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_subtotal: coupon.min_subtotal ?? 0,
        usage_limit: coupon.usage_limit ?? null,
        starts_at: coupon.starts_at ? new Date(coupon.starts_at) : null,
        ends_at: coupon.ends_at ? new Date(coupon.ends_at) : null,
      },
    });

    const typeLabel = coupon.discount_type === 'percentage'
      ? `${coupon.discount_value}%`
      : `${coupon.discount_value.toLocaleString('vi-VN')}đ`;

    console.log(`  [OK] ${coupon.code.padEnd(15)} — Giảm ${typeLabel}`);
    created++;
  }

  console.log(`\nHoàn thành! Đã tạo: ${created} | Bỏ qua: ${skipped}\n`);
}

main()
  .catch((e) => {
    console.error('Lỗi seed coupons:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
