import { builder } from '../../builder-instance.js';
import { Prisma } from '@prisma/client';

// Define the Question object type
builder.prismaObject('Question', {
  description: "Represents a question within a survey block.",
  fields: (t) => ({
    id: t.exposeID('id'),
    blockId: t.exposeInt('block_id'), 
    name: t.exposeString('name'),
    type: t.exposeString('type'),
    orderIndex: t.exposeInt('order_index'),
    isPageBreak: t.exposeBoolean('is_page_break', { nullable: true }),

    // Expose relations
    block: t.relation('block'),
    settings: t.relation('settings'),
    choiceItems: t.relation('choice_items'),
    
    // Add filtered translations field using prismaField
    translations: t.prismaField({
      type: ['QuestionTranslation'],
      args: {
        where: t.arg({
          type: 'JSON',
          required: false,
        }),
      },
      resolve: async (query, parent, args, ctx) => {
        try {
          // Construct where clause for Prisma with proper typing
          const whereClause: Prisma.QuestionTranslationWhereInput = {
            question_id: parent.id,
          };
          
          // Add language_code filter if provided
          if (args.where?.languageCode) {
            whereClause.language_code = args.where.languageCode;
          }
          
          return await ctx.prisma.questionTranslation.findMany({
            ...query,
            where: whereClause,
          });
        } catch (error) {
          console.error('Error in Question.translations resolver:', error);
          return [];
        }
      },
    }),
  }),
}); 