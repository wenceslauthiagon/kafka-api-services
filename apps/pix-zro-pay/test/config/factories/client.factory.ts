// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';

import { DefaultModel } from '@zro/common/test';
import { ClientEntity, CompanyEntity } from '@zro/pix-zro-pay/domain';
import { ClientModel } from '@zro/pix-zro-pay/infrastructure';

const fakerModel = () => ({
  name: faker.datatype.string(),
  email: faker.datatype.string(),
  document: faker.datatype.string(),
  isBlacklisted: false,
  isValid: true,
  birthdate: faker.date.recent(),
  isRestricted: false,
  verifiedAt: faker.date.recent(),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
});

/**
 * Client model factory.
 */
factory.define<ClientModel>(ClientModel.name, ClientModel, () => {
  return {
    ...fakerModel(),
    companyId: faker.datatype.number(),
  };
});

/**
 * Client entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, ClientEntity.name);

factory.define<ClientEntity>(
  ClientEntity.name,
  DefaultModel,
  async () => {
    return {
      ...fakerModel(),
      company: new CompanyEntity({ id: faker.datatype.number() }),
    };
  },
  {
    afterBuild: (model) => {
      return new ClientEntity(model);
    },
  },
);

export const ClientFactory = factory;
