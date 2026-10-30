-- Seed: упражнения
INSERT INTO "exercise" ("name") VALUES
  ('Приседания со штангой'),
  ('Жим лёжа'),
  ('Становая тяга'),
  ('Жим стоя'),
  ('Тяга штанги в наклоне'),
  ('Подтягивания'),
  ('Румынская тяга'),
  ('Сгибания рук со штангой')
ON CONFLICT ("name") DO NOTHING;

-- Seed: готовые тренировки
INSERT INTO "workout" ("name", "description") VALUES
  ('Тренировка A', 'Ноги и грудь'),
  ('Тренировка B', 'Спина и плечи'),
  ('Тренировка C', 'Ягодицы и руки')
ON CONFLICT ("name") DO NOTHING;

-- Seed: план упражнений тренировок
INSERT INTO "workout_exercise"
  ("workout_id", "exercise_id", "position", "target_sets", "target_reps_min", "target_reps_max")
SELECT w."id", e."id", v."position", v."target_sets", v."target_reps_min", v."target_reps_max"
FROM (VALUES
  ('Тренировка A', 'Приседания со штангой', 1, 3, 6, 8),
  ('Тренировка A', 'Жим лёжа', 2, 3, 6, 8),
  ('Тренировка A', 'Тяга штанги в наклоне', 3, 3, 8, 10),
  ('Тренировка B', 'Становая тяга', 1, 2, 5, 6),
  ('Тренировка B', 'Жим стоя', 2, 3, 6, 8),
  ('Тренировка B', 'Подтягивания', 3, 3, 6, 10),
  ('Тренировка C', 'Румынская тяга', 1, 3, 8, 10),
  ('Тренировка C', 'Жим лёжа', 2, 3, 8, 10),
  ('Тренировка C', 'Сгибания рук со штангой', 3, 3, 10, 12)
) AS v("workout_name", "exercise_name", "position", "target_sets", "target_reps_min", "target_reps_max")
JOIN "workout" w ON w."name" = v."workout_name"
JOIN "exercise" e ON e."name" = v."exercise_name"
ON CONFLICT DO NOTHING;
