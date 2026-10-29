-- CreateTable
CREATE TABLE "workout_session" (
    "id" BIGSERIAL NOT NULL,
    "device_id" UUID NOT NULL,
    "workout_id" BIGINT NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workout_session_device_id_started_at_idx" ON "workout_session"("device_id", "started_at");


-- PartialUniqueIndex
CREATE UNIQUE INDEX "workout_session_one_active_per_device"
  ON "workout_session" ("device_id")
  WHERE "finished_at" IS NULL;
