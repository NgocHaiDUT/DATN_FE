-- CreateTable
CREATE TABLE "public"."wallet_topup_requests" (
    "id" SERIAL NOT NULL,
    "wallet_id" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "transaction_id" TEXT,
    "vnp_txn_ref" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_topup_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallet_topup_requests_vnp_txn_ref_key" ON "public"."wallet_topup_requests"("vnp_txn_ref");

-- CreateIndex
CREATE INDEX "wallet_topup_requests_wallet_id_idx" ON "public"."wallet_topup_requests"("wallet_id");

-- CreateIndex
CREATE INDEX "wallet_topup_requests_status_idx" ON "public"."wallet_topup_requests"("status");

-- AddForeignKey
ALTER TABLE "public"."wallet_topup_requests" ADD CONSTRAINT "wallet_topup_requests_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."user_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
