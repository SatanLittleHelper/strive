-- CreateTable
CREATE TABLE "workout_exercise" (
    "workout_id" BIGINT NOT NULL,
    "exercise_id" BIGINT NOT NULL,
    "position" INTEGER NOT NULL,
    "target_sets" INTEGER NOT NULL,
    "target_reps_min" INTEGER NOT NULL,
    "target_reps_max" INTEGER NOT NULL,

    CONSTRAINT "workout_exercise_pkey" PRIMARY KEY ("workout_id","exercise_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workout_exercise_workout_id_position_key" ON "workout_exercise"("workout_id", "position");

-- AddForeignKey
ALTER TABLE "workout_exercise" ADD CONSTRAINT "workout_exercise_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_exercise" ADD CONSTRAINT "workout_exercise_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- CheckConstraint
ALTER TABLE "workout_exercise"
  ADD CONSTRAINT "workout_exercise_targets_check"
  CHECK (target_sets > 0 AND target_reps_min > 0 AND target_reps_max >= target_reps_min);
