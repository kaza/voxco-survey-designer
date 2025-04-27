import { builder } from '../../builder-instance.js';

// Define the BlockTranslation object type
builder.prismaObject('BlockTranslation', {
  description: "Translations for a Block's fields.",
  fields: (t) => ({
    blockId: t.exposeInt('block_id'),
    languageCode: t.exposeString('language_code'),
    name: t.exposeString('name'), // Translated block name
    block: t.relation('block'), // Relation back to Block
  }),
}); 