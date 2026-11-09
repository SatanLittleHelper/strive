-- CreateTable
CREATE TABLE "set_result" (
    "session_id" BIGINT NOT NULL,
    "workout_exercise_id" BIGINT NOT NULL,
    "set_number" INTEGER NOT NULL,
    "weight" DECIMAL(6,2) NOT NULL,
    "reps" INTEGER NOT NULL,
    "rpe" INTEGER,
    "note" TEXT,
    "completed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "set_result_pkey" PRIMARY KEY ("session_id","workout_exercise_id","set_number")
);

-- AddForeignKey
ALTER TABLE "set_result" ADD CONSTRAINT "set_result_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "workout_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- CreateIndex
CREATE INDEX "set_result_workout_exercise_id_idx" ON "set_result"("workout_exercise_id");

-- AddForeignKey
ALTER TABLE "set_result" ADD CONSTRAINT "set_result_workout_exercise_id_fkey" FOREIGN KEY ("workout_exercise_id") REFERENCES "workout_exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CheckConstraint
ALTER TABLE "set_result"
  ADD CONSTRAINT "set_result_values_check"
  CHECK (
    set_number > 0
    AND weight >= 0
    AND reps > 0
    AND (rpe IS NULL OR rpe BETWEEN 1 AND 5)
  );
