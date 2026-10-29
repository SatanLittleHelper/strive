-- CreateTable
CREATE TABLE "exercise" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "exercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exercise_name_key" ON "exercise"("name");
