import { factory } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { SmsTemplateModel } from '@zro/notifications/infrastructure';

/**
 * SmsTemplate factory.
 */
factory.define<SmsTemplateModel>(
  SmsTemplateModel.name,
  SmsTemplateModel,
  () => {
    return {
      markups: ['key', 'code'],
      body: faker.lorem.paragraphs(2) + ' {{code}} {{key}}',
      tag: faker.lorem.word().toUpperCase(),
    };
  },
);

export const SmsTemplateFactory = factory;
