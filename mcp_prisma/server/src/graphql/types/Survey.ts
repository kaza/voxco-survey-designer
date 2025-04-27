import { builder } from '../../builder-instance.js';

// Define the Survey object type based on the Prisma model
builder.prismaObject('Survey', {
  fields: (t) => ({
    id: t.exposeID('id'), // Expose 'id' as GraphQL ID type
    name: t.exposeString('name'),
    createdAt: t.expose('created_at', { type: 'DateTime' }), // Expose DateTime field
    configVersion: t.exposeInt('config_version'),
    defaultLanguage: t.exposeString('default_language'),
    settings: t.relation('settings'), // Expose the relation to SurveySetting
    languages: t.relation('languages'), // Expose the relation to SurveyLanguage
    blocks: t.relation('blocks'), // Expose the relation to Block
    translations: t.relation('translations'), // Expose the relation to SurveyTranslation
  }),
}); 