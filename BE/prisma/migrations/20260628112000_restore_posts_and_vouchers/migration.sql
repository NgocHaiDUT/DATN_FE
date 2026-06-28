-- Restore schema objects that are present in schema.prisma but were missing from
-- the committed migration history.

CREATE TYPE "public"."moderation_status" AS ENUM ('approved', 'rejected', 'removed');

ALTER TABLE "public"."coupons" ADD COLUMN "voucher_type" TEXT NOT NULL DEFAULT 'order';

ALTER TABLE "public"."order_coupons" ADD COLUMN "user_voucher_id" INTEGER;

CREATE TABLE "public"."user_vouchers" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "coupon_id" INTEGER NOT NULL,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'available',
    "starts_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "used_at" TIMESTAMP(3),
    "order_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_vouchers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."vr_model_reviews" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "content" TEXT,
    "reward_voucher_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vr_model_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."vr_review_prompt_settings" (
    "user_id" INTEGER NOT NULL,
    "snooze_until" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vr_review_prompt_settings_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE "public"."posts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "shop_id" INTEGER,
    "post_type" TEXT NOT NULL DEFAULT 'post',
    "title" TEXT,
    "content_md" TEXT NOT NULL,
    "moderation_status" "public"."moderation_status" NOT NULL DEFAULT 'approved',
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_story" BOOLEAN NOT NULL DEFAULT false,
    "story_type" TEXT,
    "media_url" TEXT,
    "thumbnail_url" TEXT,
    "duration" INTEGER,
    "caption" TEXT,
    "background_color" TEXT,
    "text_color" TEXT,
    "text_position" TEXT,
    "expires_at" TIMESTAMP(3),
    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."post_media" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "media_url" TEXT NOT NULL,
    "media_type" TEXT NOT NULL DEFAULT 'image',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "post_media_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."post_products" (
    "post_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    CONSTRAINT "post_products_pkey" PRIMARY KEY ("post_id","product_id")
);

CREATE TABLE "public"."tags" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."post_tags" (
    "post_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
    CONSTRAINT "post_tags_pkey" PRIMARY KEY ("post_id","tag_id")
);

CREATE INDEX "user_vouchers_user_id_status_idx" ON "public"."user_vouchers"("user_id", "status");
CREATE INDEX "user_vouchers_coupon_id_idx" ON "public"."user_vouchers"("coupon_id");
CREATE INDEX "user_vouchers_expires_at_idx" ON "public"."user_vouchers"("expires_at");
CREATE INDEX "vr_model_reviews_user_id_created_at_idx" ON "public"."vr_model_reviews"("user_id", "created_at");
CREATE INDEX "posts_user_id_idx" ON "public"."posts"("user_id");
CREATE INDEX "posts_shop_id_idx" ON "public"."posts"("shop_id");
CREATE INDEX "post_media_post_id_idx" ON "public"."post_media"("post_id");
CREATE UNIQUE INDEX "tags_slug_key" ON "public"."tags"("slug");
CREATE INDEX "order_coupons_user_voucher_id_idx" ON "public"."order_coupons"("user_voucher_id");

ALTER TABLE "public"."order_coupons" ADD CONSTRAINT "order_coupons_user_voucher_id_fkey" FOREIGN KEY ("user_voucher_id") REFERENCES "public"."user_vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."user_vouchers" ADD CONSTRAINT "user_vouchers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."user_vouchers" ADD CONSTRAINT "user_vouchers_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."user_vouchers" ADD CONSTRAINT "user_vouchers_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."vr_model_reviews" ADD CONSTRAINT "vr_model_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."vr_model_reviews" ADD CONSTRAINT "vr_model_reviews_reward_voucher_id_fkey" FOREIGN KEY ("reward_voucher_id") REFERENCES "public"."user_vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."vr_review_prompt_settings" ADD CONSTRAINT "vr_review_prompt_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."posts" ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."posts" ADD CONSTRAINT "posts_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."post_media" ADD CONSTRAINT "post_media_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."post_products" ADD CONSTRAINT "post_products_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."post_products" ADD CONSTRAINT "post_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."post_tags" ADD CONSTRAINT "post_tags_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."post_tags" ADD CONSTRAINT "post_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
