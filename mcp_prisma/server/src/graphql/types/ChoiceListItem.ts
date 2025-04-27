import { builder } from '../../builder-instance.js';
import { Prisma } from '@prisma/client';

// Define the ChoiceListItem object type
builder.prismaObject('ChoiceListItem', {
  description: "Represents a single choice item for a question (e.g., an option in a radio button list).",
  fields: (t) => ({
    id: t.exposeID('id'),
    questionId: t.exposeInt('question_id'), // Expose the foreign key
    value: t.exposeString('value'), // The choice value (e.g., the code)
    position: t.exposeInt('position'), // Display order
    settingVisible: t.exposeBoolean('setting_visible', { nullable: true }), // Prisma type is Boolean?
    settingExclusive: t.exposeBoolean('setting_exclusive', { nullable: true }), // Prisma type is Boolean?

    // Expose the relation back to Question
    question: t.relation('question'),
    
    // Add filtered translations field using prismaField
    translations: t.prismaField({
      type: ['ChoiceListItemTranslation'],
      args: {
        where: t.arg({
          type: 'JSON',
          required: false,
        }),
      },
      resolve: async (query, parent, args, ctx) => {
        try {
          // Construct where clause for Prisma with proper typing
          const whereClause: Prisma.ChoiceListItemTranslationWhereInput = {
            choice_list_item_id: parent.id,
          };
          
          // Add language_code filter if provided
          if (args.where?.languageCode) {
            whereClause.language_code = args.where.languageCode;
          }
          
          return await ctx.prisma.choiceListItemTranslation.findMany({
            ...query,
            where: whereClause,
          });
        } catch (error) {
          console.error('Error in ChoiceListItem.translations resolver:', error);
          return [];
        }
      },
    }),
  }),
}); 