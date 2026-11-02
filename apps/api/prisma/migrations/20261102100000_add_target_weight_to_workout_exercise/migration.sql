-- AlterTable
ALTER TABLE "workout_exercise" ADD COLUMN "target_weight" DECIMAL(6,2);

-- CheckConstraint
ALTER TABLE "workout_exercise"
  ADD CONSTRAINT "workout_exercise_target_weight_check"
  CHECK (target_weight IS NULL OR target_weight >= 0);
