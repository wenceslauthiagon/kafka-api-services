import { factory } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { SmsState } from '@zro/notifications/domain';
import { SmsModel, SmsTemplateModel } from '@zro/notifications/infrastructure';

const states = Object.values(SmsState);

/**
 * Sms factory.
 */
factory.define<SmsModel>(SmsModel.name, SmsModel, () => {
  return {
    userId: faker.datatype.uuid(),
    phoneNumber:
      '+551198' + faker.datatype.number(9999999).toString().padStart(7, '0'),
    body: faker.lorem.paragraphs(3),
    issuedBy: faker.datatype.uuid(),
    state: states[Math.floor(Math.random() * states.length)],
    templateId: factory.assoc(SmsTemplateModel.name, 'id'),
  };
});

export const SmsFactory = factory;
