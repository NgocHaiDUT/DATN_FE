-- AlterTable: add commission_rate to shops
ALTER TABLE "shops" ADD COLUMN "commission_rate" DECIMAL(65,30) NOT NULL DEFAULT 0.03;

-- CreateTable: seller_wallets
CREATE TABLE "seller_wallets" (
    "id" SERIAL NOT NULL,
    "shop_id" INTEGER NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "pending_balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_earned" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "seller_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable: wallet_transactions
CREATE TABLE "wallet_transactions" (
    "id" SERIAL NOT NULL,
    "wallet_id" INTEGER NOT NULL,
    "order_id" INTEGER,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: platform_revenue
CREATE TABLE "platform_revenue" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "shop_id" INTEGER NOT NULL,
    "gross_amount" DECIMAL(65,30) NOT NULL,
    "commission_rate" DECIMAL(65,30) NOT NULL,
    "commission_amt" DECIMAL(65,30) NOT NULL,
    "seller_amt" DECIMAL(65,30) NOT NULL,
    "settled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "platform_revenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable: payout_requests
CREATE TABLE "payout_requests" (
    "id" SERIAL NOT NULL,
    "shop_id" INTEGER NOT NULL,
    "wallet_id" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "bank_name" TEXT,
    "bank_account" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "admin_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seller_wallets_shop_id_key" ON "seller_wallets"("shop_id");
CREATE INDEX "wallet_transactions_wallet_id_idx" ON "wallet_transactions"("wallet_id");
CREATE INDEX "wallet_transactions_created_at_idx" ON "wallet_transactions"("created_at" DESC);
CREATE UNIQUE INDEX "platform_revenue_order_id_key" ON "platform_revenue"("order_id");
CREATE INDEX "platform_revenue_shop_id_idx" ON "platform_revenue"("shop_id");
CREATE INDEX "platform_revenue_settled_at_idx" ON "platform_revenue"("settled_at");
CREATE INDEX "payout_requests_shop_id_idx" ON "payout_requests"("shop_id");
CREATE INDEX "payout_requests_status_idx" ON "payout_requests"("status");

-- AddForeignKey
ALTER TABLE "seller_wallets" ADD CONSTRAINT "seller_wallets_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "seller_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "seller_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
