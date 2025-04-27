import { builder } from '../../builder-instance.js';

// Define the BlockSetting object type
builder.prismaObject('BlockSetting', {
  description: "Settings specific to a block, represented as key-value pairs.",
  fields: (t) => ({
    // Expose component fields of the composite primary key
    blockId: t.exposeInt('block_id'),
    settingKey: t.exposeString('setting_key'),

    // Expose other fields
    settingValue: t.exposeString('setting_value', { nullable: true }), // Prisma type is String?

    // Expose the relation back to Block
    block: t.relation('block'),

    // Omit translations relation for now
    // translations: t.relation('translations')
  }),
}); 