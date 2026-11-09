ALTER TABLE "workout_exercise" ADD COLUMN "superset_group" INTEGER;

ALTER TABLE "workout_exercise"
  ADD CONSTRAINT "workout_exercise_superset_group_positive"
  CHECK ("superset_group" IS NULL OR "superset_group" > 0);
