import { factory } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { EmailTemplateModel } from '@zro/notifications/infrastructure';

/**
 * EmailTemplate factory.
 */
factory.define<EmailTemplateModel>(
  EmailTemplateModel.name,
  EmailTemplateModel,
  () => {
    return {
      markups: ['key', 'code'],
      title: faker.lorem.words(3) + ' {{key}}',
      body: faker.lorem.paragraphs(2) + ' {{code}}',
      html: null,
      tag: faker.lorem.word().toUpperCase(),
    };
  },
);

export const EmailTemplateFactory = factory;
