-- Порядок плана — порядок id строк, поэтому строки «Махи №2» и трицепс-упражнения
-- в «Груди» и «Груди 2» меняются содержимым (и подходами), чтобы шло: трицепс, махи, трицепс, махи
CREATE TEMP TABLE swap_pair AS
SELECT a."id" AS "maxi_id", b."id" AS "triceps_id"
FROM "workout" w
JOIN "workout_exercise" a ON a."workout_id" = w."id" AND a."occurrence" = 2
JOIN "exercise" ea ON ea."id" = a."exercise_id" AND ea."name" = 'Махи гантелями в стороны стоя'
JOIN "workout_exercise" b ON b."workout_id" = w."id"
JOIN "exercise" eb ON eb."id" = b."exercise_id"
  AND eb."name" IN ('Французский жим с гантелями лежа', 'Разгибание в трицепс-машине')
WHERE w."name" IN ('Грудь', 'Грудь 2');

CREATE TEMP TABLE swap_content AS
SELECT we."id", we."exercise_id", we."occurrence", we."target_sets", we."target_reps",
  we."target_weight", we."superset_group"
FROM "workout_exercise" we
WHERE we."id" IN (SELECT "maxi_id" FROM swap_pair UNION SELECT "triceps_id" FROM swap_pair);

CREATE TEMP TABLE swap_set_result AS
SELECT sr.*, CASE WHEN sr."workout_exercise_id" = p."maxi_id" THEN p."triceps_id" ELSE p."maxi_id" END AS "new_exercise_row_id"
FROM "set_result" sr
JOIN swap_pair p ON sr."workout_exercise_id" IN (p."maxi_id", p."triceps_id");

DELETE FROM "set_result"
WHERE "workout_exercise_id" IN (SELECT "id" FROM swap_content);

-- сдвиг occurrence снимает конфликт уникального ключа на время обмена
UPDATE "workout_exercise" SET "occurrence" = "occurrence" + 100
WHERE "id" IN (SELECT "id" FROM swap_content);

UPDATE "workout_exercise" we
SET "exercise_id" = c."exercise_id", "occurrence" = c."occurrence", "target_sets" = c."target_sets",
  "target_reps" = c."target_reps", "target_weight" = c."target_weight", "superset_group" = c."superset_group"
FROM swap_pair p
JOIN swap_content c ON (c."id" = p."triceps_id")
WHERE we."id" = p."maxi_id";

UPDATE "workout_exercise" we
SET "exercise_id" = c."exercise_id", "occurrence" = c."occurrence", "target_sets" = c."target_sets",
  "target_reps" = c."target_reps", "target_weight" = c."target_weight", "superset_group" = c."superset_group"
FROM swap_pair p
JOIN swap_content c ON (c."id" = p."maxi_id")
WHERE we."id" = p."triceps_id";

INSERT INTO "set_result"
  ("session_id", "workout_exercise_id", "set_number", "weight", "reps", "rpe", "note", "completed_at", "updated_at")
SELECT "session_id", "new_exercise_row_id", "set_number", "weight", "reps", "rpe", "note", "completed_at", "updated_at"
FROM swap_set_result;

DROP TABLE swap_set_result;
DROP TABLE swap_content;
DROP TABLE swap_pair;
