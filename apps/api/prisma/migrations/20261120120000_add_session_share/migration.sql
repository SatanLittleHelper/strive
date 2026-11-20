-- AlterTable
ALTER TABLE "workout_session" ADD COLUMN     "share_expires_at" TIMESTAMPTZ(6),
ADD COLUMN     "share_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "workout_session_share_token_key" ON "workout_session"("share_token");
