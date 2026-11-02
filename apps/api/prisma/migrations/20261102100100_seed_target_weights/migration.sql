-- Seed: стартовые целевые веса (кг); подтягивания — свой вес, остаётся NULL
UPDATE "workout_exercise" AS we
SET "target_weight" = v."weight"
FROM (VALUES
  ('Тренировка A', 'Приседания со штангой', 60),
  ('Тренировка A', 'Жим лёжа', 50),
  ('Тренировка A', 'Тяга штанги в наклоне', 40),
  ('Тренировка B', 'Становая тяга', 80),
  ('Тренировка B', 'Жим стоя', 35),
  ('Тренировка C', 'Румынская тяга', 60),
  ('Тренировка C', 'Жим лёжа', 40),
  ('Тренировка C', 'Сгибания рук со штангой', 25)
) AS v("workout_name", "exercise_name", "weight")
JOIN "workout" w ON w."name" = v."workout_name"
JOIN "exercise" e ON e."name" = v."exercise_name"
WHERE we."workout_id" = w."id" AND we."exercise_id" = e."id";
