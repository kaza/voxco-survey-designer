<!-- Generated by SpecStory -->

# Creating and Updating Translations (2025-04-27 17:15:33)

_**User**_

hey how should we create a new translation in a language, and should we make a distinction between update and crete ? should we create it if we receive an update and its not existing?

---

_**Assistant**_



---

I promise I will not do more than one change at a time.

Looking at your current setup, you only have an `updateQuestionTranslation` mutation that requires the translation to already exist. Here's what I recommend:

For translation management, it's best to create separate mutations:

1. `createQuestionTranslation` - explicitly for creating new translations
2. `updateQuestionTranslation` - only for updating existing ones (you already have this)

Separating these operations follows the single responsibility principle and makes your API intentions clear. It also prevents accidental creation when updates were intended and vice versa.

Would you like me to sketch out how a `createQuestionTranslation` mutation might look based on your existing code?

---

_**User**_

ok, lets do that

---

_**Assistant**_



---

I'll create a `createQuestionTranslation` mutation that will specifically handle creating new translations. This follows the single responsibility principle and makes the API more intuitive.

---

```diff
  import { builder } from '../../builder-instance.js';
  import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
+ 
+ // Define the input type for createQuestionTranslation
+ const CreateQuestionTranslationInput = builder.inputType('CreateQuestionTranslationInput', {
+   fields: (t) => ({
+     text: t.string({ required: true, description: "The translated text for the question." }),
+   }),
+ });
  
  // Define the input type for updateQuestionTranslation
```

```diff
    }),
  });
+ 
+ // Define the createQuestionTranslation mutation field
+ builder.mutationField('createQuestionTranslation', (t) =>
+   t.prismaField({
+     description: "Creates a new translation for a specific question.",
+     type: 'QuestionTranslation',
+     args: {
+       questionId: t.arg.int({ required: true, description: "The ID of the question." }),
+       languageCode: t.arg.string({ required: true, description: "The language code of the translation (e.g., 'en')." }),
+       input: t.arg({ type: CreateQuestionTranslationInput, required: true }),
+     },
+     resolve: async (query, _root, args, ctx) => {
+       const { questionId, languageCode } = args;
+       const { text } = args.input;
+ 
+       if (!text) {
+         throw new Error("Text is required for creating a translation.");
+       }
+ 
+       try {
+         // First check if the translation already exists
+         const existingTranslation = await ctx.prisma.questionTranslation.findUnique({
+           where: {
+             question_id_language_code: {
+               question_id: questionId,
+               language_code: languageCode,
+             },
+           },
+         });
+ 
+         if (existingTranslation) {
+           throw new Error(`Translation for question ID ${questionId} in language ${languageCode} already exists.`);
+         }
+ 
+         // Create the new translation
+         const newTranslation = await ctx.prisma.questionTranslation.create({
+           data: {
+             question: {
+               connect: {
+                 id: questionId,
+               },
+             },
+             language_code: languageCode,
+             text: text,
+           },
+           ...query,
+         });
+ 
+         return newTranslation;
+       } catch (error: unknown) {
+         if (error instanceof PrismaClientKnownRequestError) {
+           // Preserve the original Prisma error
+           throw error;
+         }
+         // For other types of errors, still throw a sensible error
+         throw new Error(`Failed to create translation: ${(error as Error).message}`);
+       }
+     },
+   })
+ );
  
  // Define the updateQuestionTranslation mutation field
```

---

I've added a new `createQuestionTranslation` mutation that:

1. Accepts similar parameters as the update mutation (questionId, languageCode, and text)
2. Checks if a translation already exists for that question/language combination
3. Creates a new translation if one doesn't exist
4. Includes proper error handling

This separation between create and update operations keeps each mutation focused on a single responsibility and makes the API more intuitive. The create mutation will explicitly fail if the translation already exists, while the update mutation fails if the translation doesn't exist.

Would you like me to make any adjustments to this implementation?

---

_**User**_

lets add the same logic fo choiceTranslations

---

_**Assistant**_



---

I'll create a new file for choice translations with similar logic to what we implemented for question translations.

---

<details>
            <summary>Searched codebase "choiceTranslation.ts" • **2** results</summary>
        
| File |
|------|
| `undefined` |
| `undefined` |

</details>

---

I see there's a file for choice list item translations. Let me check its structure before creating our new file.

---

Read file: server/src/graphql/mutations/choiceListItemTranslation.ts

---

Now I'll create the equivalent for choice list item translations by adding the create mutation to the existing file:

---



---



---

