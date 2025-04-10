import { z } from "zod";

export const TranslationSchema = z.object({
  id: z.string()
    .describe("Unique database identifier for the translation record. Corresponds to GraphQL ID!"),
  element_type: z.string()
    .describe("The type of element this translation applies to (e.g., 'Survey', 'Question')."),
  element_id: z.number()
    .describe("The database ID of the element being translated."),
  text_key: z.string()
    .describe("The specific text component being translated (e.g., 'TEXT', 'TITLE')."),
  language_code: z.string()
    .describe("The language code for this translation (e.g., 'en', 'fr')."),
  translated_text: z.string()
    .describe("The actual translated text content."),
})
.describe("Represents a single piece of translated text for a specific element, key, and language.");
export type Translation = z.infer<typeof TranslationSchema>;


export const SurveyLanguageSchema = z.object({
  language_code: z.string()
    .describe("The language code (e.g., 'en', 'fr')."),
})
.describe("Represents a language available for a specific survey.");
export type SurveyLanguage = z.infer<typeof SurveyLanguageSchema>;


export const SurveySettingSchema = z.object({
  setting_key: z.string()
    .describe("The key identifying the setting (e.g., 'DISABLE_SMART_PHONE_MOBILE_SUPPORT')."),
  setting_value: z.string().nullable()
    .describe("The value of the setting (stored as text). Nullable in GraphQL."),
  translations: z.array(TranslationSchema)
    .describe("Translations associated with this specific setting."),
})
.describe("Represents a global setting for a survey as a key-value pair.");
export type SurveySetting = z.infer<typeof SurveySettingSchema>;


export const BlockSettingSchema = z.object({
  setting_key: z.string()
    .describe("The key identifying the setting (e.g., 'Description')."),
  setting_value: z.string().nullable()
    .describe("The value of the setting (stored as text). Nullable in GraphQL."),
  translations: z.array(TranslationSchema)
    .describe("Translations associated with this specific setting."),
})
.describe("Represents a setting specific to a block as a key-value pair.");
export type BlockSetting = z.infer<typeof BlockSettingSchema>;


export const QuestionSettingSchema = z.object({
  setting_key: z.string()
    .describe("The key identifying the setting (e.g., 'AnswerRequired', 'EnableMobileRendering')."),
  setting_value: z.string().nullable()
    .describe("The value of the setting (stored as text). Nullable in GraphQL."),
  translations: z.array(TranslationSchema)
    .describe("Translations associated with this specific setting."),
})
.describe("Represents a setting specific to a question as a key-value pair.");
export type QuestionSetting = z.infer<typeof QuestionSettingSchema>;


export const ChoiceListItemSchema = z.object({
  id: z.string()
    .describe("Unique database identifier for this specific choice item row. Corresponds to GraphQL ID!"),
  value: z.string()
    .describe("The actual data value stored or used when this choice is selected."),
  position: z.number()
    .describe("The intended display order of this choice within the question's list."),
  setting_visible: z.boolean().nullable()
    .describe("Indicates if the choice should be visible to the respondent. Nullable in GraphQL."),
  setting_exclusive: z.boolean().nullable()
    .describe("Indicates if selecting this choice prevents selecting others. Nullable in GraphQL."),
  translations: z.array(TranslationSchema)
    .describe("Translations associated with this specific choice item (e.g., for choice text)."),
})
.describe("Represents a single predefined answer option for a choice-based question.");
export type ChoiceListItem = z.infer<typeof ChoiceListItemSchema>;


export const QuestionSchema = z.object({
  id: z.string()
    .describe("Unique database identifier for the question. Corresponds to GraphQL ID!"),
  name: z.string()
    .describe("Internal name or identifier for the question."),
  type: z.string()
    .describe("Indicates the kind of question (e.g., 'RadioButton', 'NumericAnswer')."),
  order_index: z.number()
    .describe("The sequential position of this question within its block."),
  is_page_break: z.boolean().nullable()
    .describe("Flag indicating if a page break should occur after this question. Nullable in GraphQL."),
  choice_items: z.array(ChoiceListItemSchema)
    .describe("A list of predefined answer options available for this question."),
  settings: z.array(QuestionSettingSchema)
    .describe("Settings specific to this question."),
  translations: z.array(TranslationSchema)
    .describe("Translations associated directly with the Question entity."),
})
.describe("Represents a single question presented to the respondent.");
export type Question = z.infer<typeof QuestionSchema>;


export const BlockSchema = z.object({
  id: z.string()
    .describe("Unique database identifier for the block. Corresponds to GraphQL ID!"),
  name: z.string()
    .describe("User-defined name of the block."),
  order_index: z.number()
    .describe("The sequential position of this block within the survey's list of blocks."),
  skip_logic: z.string().nullable()
    .describe("Condition string determining if this block should be skipped. Nullable in GraphQL."),
  questions: z.array(QuestionSchema)
    .describe("A list of sequential questions contained within this block."),
  settings: z.array(BlockSettingSchema)
    .describe("Settings specific to this block."),
  translations: z.array(TranslationSchema)
    .describe("Translations associated directly with the Block entity."),
})
.describe("Represents a logical grouping of questions within a survey.");
export type Block = z.infer<typeof BlockSchema>;


export const SurveySchema = z.object({
  id: z.string()
    .describe("Unique database identifier for the survey. Corresponds to GraphQL ID!"),
  name: z.string()
    .describe("The user-defined name or title of the survey."),
  schema_version: z.string().nullable()
    .describe("The version of the underlying data schema format used. Nullable in GraphQL."),
  created_at: z.string() // Could refine with z.string().datetime() if needed
    .describe("Timestamp when the survey record was created. Assumed ISO8601 string."),
  config_version: z.number()
    .describe("The specific version number of this survey configuration."),
  use_s2: z.boolean()
    .describe("Flag possibly indicating the use of a specific system or feature version."),
  default_language: z.string()
    .describe("The primary language code (e.g., 'en') for the survey."),
  blocks: z.array(BlockSchema)
    .describe("A list of sequential content blocks within the survey."),
  settings: z.array(SurveySettingSchema)
    .describe("Global settings associated with this survey."),
  languages: z.array(SurveyLanguageSchema)
    .describe("Languages available for this survey."),
  translations: z.array(TranslationSchema)
    .describe("Translations associated directly with the Survey entity."),
})
.describe("Represents the top-level survey object, containing its metadata and structure.");
export type Survey = z.infer<typeof SurveySchema>;