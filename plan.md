# Survey Update Operations Plan

This document outlines the plan for implementing update operations for the survey structure.

## 1. Entities Requiring Update Operations

Based on `mcp_prisma/src/survey.types.ts`, the following entities will have dedicated update operations:

*   `Survey`
*   `Block`
*   `Question`
*   `ChoiceListItem`
*   `SurveySetting`
*   `BlockSetting`
*   `QuestionSetting`
*   `Translation`

## 2. Defined Update Operations

The following specific operations will be defined:

*   **`updateSurvey`**: Modifies basic fields of a `Survey` (e.g., `name`, `default_language`).
*   **`updateBlock`**: Modifies basic fields of a `Block` (e.g., `name`, `order_index`, `skip_logic`).
*   **`updateQuestion`**: Modifies basic fields of a `Question` (e.g., `name`, `type`, `order_index`, `is_page_break`).
*   **`updateChoiceListItem`**: Modifies fields of a `ChoiceListItem` (e.g., `value`, `position`, `setting_visible`, `setting_exclusive`).
*   **`updateSurveySetting`**: Modifies the `setting_value` for a `SurveySetting`, identified by `Survey` ID and `setting_key`.
*   **`updateBlockSetting`**: Modifies the `setting_value` for a `BlockSetting`, identified by `Block` ID and `setting_key`.
*   **`updateQuestionSetting`**: Modifies the `setting_value` for a `QuestionSetting`, identified by `Question` ID and `setting_key`.
*   **`updateTranslation`**: Modifies the `translated_text` for a `Translation`, identified by its `id`.

## 3. Input Schema Definition

*   Zod schemas will be defined for the input data of each update operation.
*   These schemas will enforce the required identifiers (like `surveyId`, `blockId`, `questionId`, `choiceListItemId`, `translationId`, `settingKey`) and the specific fields that can be modified.
*   Updates will be partial: only the fields provided in the input object will be updated in the database.
*   Fields like entity IDs (`id`), nested entity lists (`blocks`, `questions`, etc.), and timestamps (`created_at`) will be excluded from the update input schemas.

## 4. File Structure

*   A new directory will be created: `mcp_prisma/src/operations/`.
*   This directory will hold the Zod schemas and TypeScript types for the create and update operation inputs.
*   Files will be organized by entity:
    *   `mcp_prisma/src/operations/survey.ts`
    *   `mcp_prisma/src/operations/block.ts`
    *   `mcp_prisma/src/operations/question.ts`
    *   `mcp_prisma/src/operations/choice.ts`
    *   `mcp_prisma/src/operations/setting.ts`
    *   `mcp_prisma/src/operations/translation.ts`
*   These files will import necessary base types from `mcp_prisma/src/survey.types.ts`.

## 5. Implementation Outline (Future Steps)

- [ ] 1. Define Zod input schemas and corresponding TypeScript types in the respective `mcp_prisma/src/operations/*.ts` files.
- [ ] 2. Implement backend logic (API endpoints, database interactions) using these defined types and schemas.
- [ ] 3. (Optional) Implement integration tests for the database operations.
- [ ] 4. Implement an MCP Server to expose these operations as tools.
    - [ ] 4.a. Start with basic echo functionality.
    - [ ] 4.b. Expose database operations (create/update) via MCP tools. 