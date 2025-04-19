/*
  Warnings:

  - You are about to drop the `Translations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Translations";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "SurveyTranslations" (
    "survey_id" INTEGER NOT NULL,
    "language_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    PRIMARY KEY ("survey_id", "language_code"),
    CONSTRAINT "SurveyTranslations_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "Surveys" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BlockTranslations" (
    "block_id" INTEGER NOT NULL,
    "language_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    PRIMARY KEY ("block_id", "language_code"),
    CONSTRAINT "BlockTranslations_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "Blocks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuestionTranslations" (
    "question_id" INTEGER NOT NULL,
    "language_code" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    PRIMARY KEY ("question_id", "language_code"),
    CONSTRAINT "QuestionTranslations_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Questions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChoiceListItemTranslations" (
    "choice_list_item_id" INTEGER NOT NULL,
    "language_code" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    PRIMARY KEY ("choice_list_item_id", "language_code"),
    CONSTRAINT "ChoiceListItemTranslations_choice_list_item_id_fkey" FOREIGN KEY ("choice_list_item_id") REFERENCES "ChoiceListItems" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
