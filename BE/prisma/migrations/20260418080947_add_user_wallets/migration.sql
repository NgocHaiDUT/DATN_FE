-- CreateTable
CREATE TABLE "public"."user_wallets" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_wallet_transactions" (
    "id" SERIAL NOT NULL,
    "wallet_id" INTEGER NOT NULL,
    "order_id" INTEGER,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_wallets_user_id_key" ON "public"."user_wallets"("user_id");

-- CreateIndex
CREATE INDEX "user_wallet_transactions_wallet_id_idx" ON "public"."user_wallet_transactions"("wallet_id");

-- CreateIndex
CREATE INDEX "user_wallet_transactions_created_at_idx" ON "public"."user_wallet_transactions"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "public"."user_wallets" ADD CONSTRAINT "user_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_wallet_transactions" ADD CONSTRAINT "user_wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."user_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
