import { factory } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { PixKeyVerificationState } from '@zro/pix-keys/domain';
import {
  PixKeyModel,
  PixKeyVerificationModel,
} from '@zro/pix-keys/infrastructure';

const states = Object.values(PixKeyVerificationState);

/**
 * PixKey factory.
 */
factory.define<PixKeyVerificationModel>(
  PixKeyVerificationModel.name,
  PixKeyVerificationModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      pixKeyId: factory.assoc(PixKeyModel.name, 'id'),
      state: states[Math.floor(Math.random() * states.length)],
      code: faker.datatype.number(99999999).toString().padStart(5, '0'),
    };
  },
);

export const PixKeyVerificationFactory = factory;
