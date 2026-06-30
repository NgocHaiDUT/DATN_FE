require('dotenv/config');

const { PrismaClient, Prisma } = require('@prisma/client');

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

async function settleOrder(tx, order) {
  const shop = order.shop;
  const commissionRate = Number(shop.commission_rate);
  const gross = Number(order.subtotal_amount);
  const commissionAmt = Math.round(gross * commissionRate);
  const sellerAmt = gross - commissionAmt;

  await tx.platform_revenue.create({
    data: {
      order_id: order.id,
      shop_id: shop.id,
      gross_amount: gross,
      commission_rate: commissionRate,
      commission_amt: commissionAmt,
      seller_amt: sellerAmt,
    },
  });

  const wallet = await tx.seller_wallets.upsert({
    where: { shop_id: shop.id },
    create: { shop_id: shop.id },
    update: {},
  });

  await tx.seller_wallets.update({
    where: { id: wallet.id },
    data: {
      balance: { increment: sellerAmt },
      total_earned: { increment: sellerAmt },
    },
  });

  await tx.wallet_transactions.create({
    data: {
      wallet_id: wallet.id,
      order_id: order.id,
      type: 'credit_sale',
      amount: sellerAmt,
      note: `Don hang #${order.id} giao thanh cong. Hoa hong ${(commissionRate * 100).toFixed(1)}% (${commissionAmt.toLocaleString('vi')}d)`,
    },
  });

  return { sellerAmt, commissionAmt };
}

async function main() {
  const orders = await prisma.orders.findMany({
    where: {
      status: 'delivered',
      payment_status: 'paid',
    },
    include: { shop: true },
    orderBy: { id: 'asc' },
  });

  const revenueRows = orders.length
    ? await prisma.platform_revenue.findMany({
        where: { order_id: { in: orders.map((order) => order.id) } },
        select: { order_id: true },
      })
    : [];
  const settledOrderIds = new Set(revenueRows.map((row) => row.order_id));
  const missingOrders = orders.filter(
    (order) => !settledOrderIds.has(order.id),
  );

  if (!missingOrders.length) {
    console.log('No missing seller settlements found.');
    return;
  }

  console.log(
    `${apply ? 'Applying' : 'Dry run:'} ${missingOrders.length} missing seller settlement(s): ${missingOrders
      .map((order) => `#${order.id}`)
      .join(', ')}`,
  );

  let settledCount = 0;
  let sellerTotal = 0;

  for (const order of missingOrders) {
    const commissionRate = Number(order.shop.commission_rate);
    const gross = Number(order.subtotal_amount);
    const commissionAmt = Math.round(gross * commissionRate);
    const sellerAmt = gross - commissionAmt;

    if (!apply) {
      sellerTotal += sellerAmt;
      console.log(
        `- order #${order.id}: shop #${order.shop_id}, seller +${sellerAmt}, commission ${commissionAmt}`,
      );
      continue;
    }

    try {
      const result = await prisma.$transaction((tx) => settleOrder(tx, order));
      settledCount += 1;
      sellerTotal += result.sellerAmt;
      console.log(
        `- settled order #${order.id}: shop #${order.shop_id}, seller +${result.sellerAmt}, commission ${result.commissionAmt}`,
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        console.log(`- skipped order #${order.id}: already settled`);
        continue;
      }
      throw error;
    }
  }

  console.log(
    `${apply ? 'Settled' : 'Would settle'} ${apply ? settledCount : missingOrders.length} order(s), seller total +${sellerTotal}.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
