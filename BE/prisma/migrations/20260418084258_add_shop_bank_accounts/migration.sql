-- AlterTable
ALTER TABLE "public"."payout_requests" ADD COLUMN     "account_name" TEXT,
ADD COLUMN     "bank_account_id" INTEGER;

-- CreateTable
CREATE TABLE "public"."shop_bank_accounts" (
    "id" SERIAL NOT NULL,
    "shop_id" INTEGER NOT NULL,
    "bank_name" TEXT NOT NULL,
    "bank_account" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shop_bank_accounts_shop_id_idx" ON "public"."shop_bank_accounts"("shop_id");

-- AddForeignKey
ALTER TABLE "public"."payout_requests" ADD CONSTRAINT "payout_requests_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "public"."shop_bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shop_bank_accounts" ADD CONSTRAINT "shop_bank_accounts_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
