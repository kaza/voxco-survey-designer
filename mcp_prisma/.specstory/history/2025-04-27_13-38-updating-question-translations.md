<!-- Generated by SpecStory -->

# Updating Question Translations (2025-04-27 14:38:43)

_**User**_

hey, how can user update translation of a question ?

---

_**Assistant**_



---

Okay, I will only make one change at a time.

To update the translation of a question, there should be a mutation defined for it. Based on the structure in `server/src/builder.ts`, question-related mutations are likely in `server/src/graphql/mutations/question.js`.

I'll check that file to find the specific mutation for updating question translations.

---

Could not find file 'server/src/graphql/mutations/question.js' in the workspace.

---

It seems the file `server/src/graphql/mutations/question.js` doesn't exist.

Let me look for files related to question mutations or translations to see where this functionality might be located.

---

<details>
            <summary>Searched codebase "question mutation translation" • **5** results</summary>
        
| File |
|------|
| `undefined` |
| `undefined` |
| `undefined` |
| `undefined` |
| `undefined` |

</details>

---

Okay, it looks like the correct file path is `server/src/graphql/mutations/question.ts` (with a `.ts` extension, not `.js`).

I will now read this file to find the mutation for updating question translations.

---

Read file: server/src/graphql/mutations/question.ts

---

Okay, I've reviewed `server/src/graphql/mutations/question.ts`.

It defines mutations for `addQuestion`, `updateQuestion`, and `deleteQuestion`.

However, there is **no specific mutation defined here for updating a `QuestionTranslation`**. The `updateQuestion` mutation explicitly notes: "// Note: Updating question text requires mutating QuestionTranslation".

This suggests that updating the translated text of a question is handled by a different mutation, likely one focused on the `QuestionTranslation` type itself.

Would you like me to look for a `QuestionTranslation` mutation file or search for mutations related to `QuestionTranslation`?

---

_**User**_

yes :) please

---

_**Assistant**_



---

Okay, I will search for files related to `QuestionTranslation` mutations.

---

<details>
            <summary>Searched codebase "QuestionTranslation mutation" • **1** results</summary>
        
| File |
|------|
| `undefined` |

</details>

---

The search only found the type definition file `server/src/graphql/types/QuestionTranslation.ts`. This suggests that mutations for `QuestionTranslation` might not be in a dedicated file like the others.

It's possible the mutation is defined within the `QuestionTranslation.ts` type file itself, or perhaps grouped elsewhere.

Let's check the `QuestionTranslation.ts` type file first.

---

Read file: server/src/graphql/types/QuestionTranslation.ts

---

Okay, I've checked `server/src/graphql/types/QuestionTranslation.ts`. This file only defines the `QuestionTranslation` GraphQL type and its fields. It does **not** contain any mutation logic.

Given the structure observed so far:
- `server/src/builder.ts` imports mutations from separate files (`./graphql/mutations/*.ts`).
- We have mutation files for `survey`, `block`, `question`, `choiceListItem`.

It seems like a dedicated mutation file for translations is missing or hasn't been created yet. The imports in `server/src/builder.ts` confirm this, as there's no import like `./graphql/mutations/translation.ts` or similar.

To update a question translation, you would need to:
1.  **Create a new mutation file**, perhaps `server/src/graphql/mutations/questionTranslation.ts`.
2.  **Define an `updateQuestionTranslation` mutation** within that file. This mutation would likely take `questionId`, `languageCode`, and the new `text` as input and use `ctx.prisma.questionTranslation.update` to modify the database record.
3.  **Import this new mutation file** into `server/src/builder.ts` to register the mutation.

Would you like me to create this `updateQuestionTranslation` mutation?

---

_**User**_

ok, lets do that for choiceListItem as well and survey please

---

_**Assistant**_



---

