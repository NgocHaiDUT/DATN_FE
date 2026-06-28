-- CreateEnum
CREATE TYPE "public"."return_request_status" AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- CreateTable
CREATE TABLE "public"."return_requests" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "public"."return_request_status" NOT NULL DEFAULT 'pending',
    "admin_note" TEXT,
    "refund_amount" DECIMAL(65,30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "return_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "return_requests_order_id_idx" ON "public"."return_requests"("order_id");

-- CreateIndex
CREATE INDEX "return_requests_user_id_idx" ON "public"."return_requests"("user_id");

-- CreateIndex
CREATE INDEX "return_requests_status_idx" ON "public"."return_requests"("status");

-- AddForeignKey
ALTER TABLE "public"."return_requests" ADD CONSTRAINT "return_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."return_requests" ADD CONSTRAINT "return_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
