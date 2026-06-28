-- CreateTable
CREATE TABLE "public"."api_logs" (
    "id" SERIAL NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "path" VARCHAR(2048) NOT NULL,
    "status_code" INTEGER NOT NULL,
    "user_id" INTEGER,
    "ip" VARCHAR(64),
    "user_agent" VARCHAR(512),
    "duration_ms" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "api_logs_created_at_idx" ON "public"."api_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "api_logs_user_id_idx" ON "public"."api_logs"("user_id");

-- CreateIndex
CREATE INDEX "api_logs_status_code_idx" ON "public"."api_logs"("status_code");

-- CreateIndex
CREATE INDEX "api_logs_method_path_idx" ON "public"."api_logs"("method", "path");
