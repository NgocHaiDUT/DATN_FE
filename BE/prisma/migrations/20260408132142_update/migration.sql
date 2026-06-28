/*
  Warnings:

  - The values [SHARE_POST,SHARE_PROFILE,STORY_REPLY] on the enum `message_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `post_id` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `shared_profile_id` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `story` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `comments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `follows` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `likes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `post_media` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `post_products` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `post_tags` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `posts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `saved_posts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shop_follows` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `story_views` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tags` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."message_type_new" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'SHARE_PRODUCT');
ALTER TABLE "public"."messages" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "public"."messages" ALTER COLUMN "type" TYPE "public"."message_type_new" USING ("type"::text::"public"."message_type_new");
ALTER TYPE "public"."message_type" RENAME TO "message_type_old";
ALTER TYPE "public"."message_type_new" RENAME TO "message_type";
DROP TYPE "public"."message_type_old";
ALTER TABLE "public"."messages" ALTER COLUMN "type" SET DEFAULT 'TEXT';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."comments" DROP CONSTRAINT "comments_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."comments" DROP CONSTRAINT "comments_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."follows" DROP CONSTRAINT "follows_follower_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."follows" DROP CONSTRAINT "follows_following_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."likes" DROP CONSTRAINT "likes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."post_media" DROP CONSTRAINT "post_media_post_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."post_products" DROP CONSTRAINT "post_products_post_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."post_products" DROP CONSTRAINT "post_products_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."post_tags" DROP CONSTRAINT "post_tags_post_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."post_tags" DROP CONSTRAINT "post_tags_tag_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."posts" DROP CONSTRAINT "posts_shop_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."posts" DROP CONSTRAINT "posts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."saved_posts" DROP CONSTRAINT "saved_posts_post_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."saved_posts" DROP CONSTRAINT "saved_posts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."shop_follows" DROP CONSTRAINT "shop_follows_shop_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."shop_follows" DROP CONSTRAINT "shop_follows_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."story_views" DROP CONSTRAINT "story_views_post_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."story_views" DROP CONSTRAINT "story_views_viewer_id_fkey";

-- AlterTable
ALTER TABLE "public"."coupons" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."messages" DROP COLUMN "post_id",
DROP COLUMN "shared_profile_id";

-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."product_variants" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."products" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."reviews" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."shops" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "story",
ADD COLUMN     "bio" TEXT;

-- DropTable
DROP TABLE "public"."comments";

-- DropTable
DROP TABLE "public"."follows";

-- DropTable
DROP TABLE "public"."likes";

-- DropTable
DROP TABLE "public"."post_media";

-- DropTable
DROP TABLE "public"."post_products";

-- DropTable
DROP TABLE "public"."post_tags";

-- DropTable
DROP TABLE "public"."posts";

-- DropTable
DROP TABLE "public"."saved_posts";

-- DropTable
DROP TABLE "public"."shop_follows";

-- DropTable
DROP TABLE "public"."story_views";

-- DropTable
DROP TABLE "public"."tags";

-- DropEnum
DROP TYPE "public"."moderation_status";
