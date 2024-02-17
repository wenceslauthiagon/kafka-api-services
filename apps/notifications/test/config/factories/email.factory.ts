import { factory } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { EmailState } from '@zro/notifications/domain';
import {
  EmailModel,
  EmailTemplateModel,
} from '@zro/notifications/infrastructure';

const states = Object.values(EmailState);

/**
 * Email factory.
 */
factory.define<EmailModel>(EmailModel.name, EmailModel, () => {
  return {
    userId: faker.datatype.uuid(),
    to: faker.internet.email(),
    from: 'dev-no-reply@zrobank.biz',
    title: faker.lorem.words(3),
    body: faker.lorem.paragraphs(3),
    html: `<html><body>${faker.lorem.paragraphs(3)}</body></html>`,
    issuedBy: faker.datatype.uuid(),
    state: states[Math.floor(Math.random() * states.length)],
    templateId: factory.assoc(EmailTemplateModel.name, 'id'),
  };
});

export const EmailFactory = factory;
