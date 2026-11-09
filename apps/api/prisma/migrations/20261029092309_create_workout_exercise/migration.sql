-- CreateTable
CREATE TABLE "workout_exercise" (
    "id" BIGSERIAL NOT NULL,
    "workout_id" BIGINT NOT NULL,
    "exercise_id" BIGINT NOT NULL,
    "occurrence" INTEGER NOT NULL DEFAULT 1,
    "target_sets" INTEGER NOT NULL,
    "target_reps" INTEGER NOT NULL,

    CONSTRAINT "workout_exercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workout_exercise_workout_id_exercise_id_occurrence_key" ON "workout_exercise"("workout_id", "exercise_id", "occurrence");

-- CreateIndex
CREATE INDEX "workout_exercise_exercise_id_idx" ON "workout_exercise"("exercise_id");

-- AddForeignKey
ALTER TABLE "workout_exercise" ADD CONSTRAINT "workout_exercise_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_exercise" ADD CONSTRAINT "workout_exercise_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CheckConstraint
ALTER TABLE "workout_exercise"
  ADD CONSTRAINT "workout_exercise_targets_check"
  CHECK (target_sets > 0 AND target_reps > 0);

-- CheckConstraint
ALTER TABLE "workout_exercise"
  ADD CONSTRAINT "workout_exercise_occurrence_check"
  CHECK (occurrence > 0);
