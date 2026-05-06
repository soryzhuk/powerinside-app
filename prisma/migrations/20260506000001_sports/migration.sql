-- CreateTable sports
CREATE TABLE "sports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sports_name_key" ON "sports"("name");

-- AlterTable coach_profiles
ALTER TABLE "coach_profiles"
  ADD COLUMN "sportId" TEXT,
  ADD COLUMN "customSport" TEXT,
  ADD COLUMN "customSportApproved" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "coach_profiles"
  ADD CONSTRAINT "coach_profiles_sportId_fkey"
  FOREIGN KEY ("sportId") REFERENCES "sports"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default sports
INSERT INTO "sports" ("id", "name", "approved") VALUES
  ('sport_powerlifting',   'Пауерліфтинг',   true),
  ('sport_weightlifting',  'Важка атлетика',  true),
  ('sport_armwrestling',   'Армрестлінг',     true),
  ('sport_bodybuilding',   'Бодібілдинг',     true),
  ('sport_crossfit',       'Кросфіт',         true),
  ('sport_kettlebell',     'Гирьовий спорт',  true),
  ('sport_strongman',      'Стронгмен',       true),
  ('sport_wrestling',      'Боротьба',        true),
  ('sport_mma',            'MMA',             true);
