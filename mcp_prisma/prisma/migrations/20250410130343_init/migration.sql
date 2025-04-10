-- CreateTable
CREATE TABLE "Surveys" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "schema_version" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "config_version" INTEGER NOT NULL,
    "use_s2" BOOLEAN NOT NULL,
    "default_language" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "SurveySettings" (
    "survey_id" INTEGER NOT NULL,
    "setting_key" TEXT NOT NULL,
    "setting_value" TEXT,

    PRIMARY KEY ("survey_id", "setting_key"),
    CONSTRAINT "SurveySettings_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "Surveys" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SurveyLanguages" (
    "survey_id" INTEGER NOT NULL,
    "language_code" TEXT NOT NULL,

    PRIMARY KEY ("survey_id", "language_code"),
    CONSTRAINT "SurveyLanguages_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "Surveys" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Blocks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "survey_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "skip_logic" TEXT,
    CONSTRAINT "Blocks_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "Surveys" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BlockSettings" (
    "block_id" INTEGER NOT NULL,
    "setting_key" TEXT NOT NULL,
    "setting_value" TEXT,

    PRIMARY KEY ("block_id", "setting_key"),
    CONSTRAINT "BlockSettings_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "Blocks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Questions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "block_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "is_page_break" BOOLEAN DEFAULT false,
    CONSTRAINT "Questions_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "Blocks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuestionSettings" (
    "question_id" INTEGER NOT NULL,
    "setting_key" TEXT NOT NULL,
    "setting_value" TEXT,

    PRIMARY KEY ("question_id", "setting_key"),
    CONSTRAINT "QuestionSettings_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Questions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChoiceListItems" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "question_id" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "setting_visible" BOOLEAN DEFAULT true,
    "setting_exclusive" BOOLEAN DEFAULT false,
    CONSTRAINT "ChoiceListItems_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Questions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Translations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "element_type" TEXT NOT NULL,
    "element_id" INTEGER NOT NULL,
    "text_key" TEXT NOT NULL,
    "language_code" TEXT NOT NULL,
    "translated_text" TEXT NOT NULL,
    "surveyId" INTEGER,
    "surveySettingSurveyId" INTEGER,
    "surveySettingKey" TEXT,
    "blockId" INTEGER,
    "blockSettingBlockId" INTEGER,
    "blockSettingKey" TEXT,
    "questionId" INTEGER,
    "questionSettingQuestionId" INTEGER,
    "questionSettingKey" TEXT,
    "choiceListItemId" INTEGER,
    CONSTRAINT "Translations_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Surveys" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Translations_surveySettingSurveyId_surveySettingKey_fkey" FOREIGN KEY ("surveySettingSurveyId", "surveySettingKey") REFERENCES "SurveySettings" ("survey_id", "setting_key") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Translations_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "Blocks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Translations_blockSettingBlockId_blockSettingKey_fkey" FOREIGN KEY ("blockSettingBlockId", "blockSettingKey") REFERENCES "BlockSettings" ("block_id", "setting_key") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Translations_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Questions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Translations_questionSettingQuestionId_questionSettingKey_fkey" FOREIGN KEY ("questionSettingQuestionId", "questionSettingKey") REFERENCES "QuestionSettings" ("question_id", "setting_key") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Translations_choiceListItemId_fkey" FOREIGN KEY ("choiceListItemId") REFERENCES "ChoiceListItems" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Blocks_survey_id_order_index_idx" ON "Blocks"("survey_id", "order_index");

-- CreateIndex
CREATE INDEX "Questions_block_id_order_index_idx" ON "Questions"("block_id", "order_index");

-- CreateIndex
CREATE INDEX "ChoiceListItems_question_id_position_idx" ON "ChoiceListItems"("question_id", "position");

-- CreateIndex
CREATE INDEX "Translations_element_type_element_id_idx" ON "Translations"("element_type", "element_id");

-- CreateIndex
CREATE INDEX "Translations_surveySettingSurveyId_surveySettingKey_idx" ON "Translations"("surveySettingSurveyId", "surveySettingKey");

-- CreateIndex
CREATE INDEX "Translations_blockSettingBlockId_blockSettingKey_idx" ON "Translations"("blockSettingBlockId", "blockSettingKey");

-- CreateIndex
CREATE INDEX "Translations_questionSettingQuestionId_questionSettingKey_idx" ON "Translations"("questionSettingQuestionId", "questionSettingKey");

-- CreateIndex
CREATE UNIQUE INDEX "Translations_element_type_element_id_text_key_language_code_key" ON "Translations"("element_type", "element_id", "text_key", "language_code");
