import { builder } from '../../builder-instance.js';

// Define the ChoiceListItemTranslation object type
builder.prismaObject('ChoiceListItemTranslation', {
  description: "Translations for a ChoiceListItem's fields.",
  fields: (t) => ({
    choiceListItemId: t.exposeInt('choice_list_item_id'),
    languageCode: t.exposeString('language_code'),
    label: t.exposeString('label'), // Translated choice label
    choiceListItem: t.relation('choice_list_item'), // Relation back to ChoiceListItem
  }),
}); 