// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import { BankTedEntity } from '@zro/banking/domain';
import { BankTedModel } from '@zro/banking/infrastructure';

/**
 * BankTeds factory.
 */
factory.define<BankTedModel>(BankTedModel.name, BankTedModel, () => {
  return {
    id: faker.datatype.uuid(),
    ispb: faker.datatype.number(999999).toString().padStart(8, '0'),
    code: faker.datatype.number(999).toString().padStart(3, '0'),
    name: faker.datatype.uuid(),
    fullName: faker.datatype.uuid(),
    active: faker.datatype.boolean(),
    startedAt: faker.date.recent(5),
    createdAt: faker.date.recent(2),
  };
});

const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, BankTedEntity.name);

factory.define<BankTedEntity>(
  BankTedEntity.name,
  DefaultModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      ispb: faker.datatype.number(999999).toString().padStart(8, '0'),
      code: faker.datatype.number(999).toString().padStart(3, '0'),
      name: faker.datatype.uuid(),
      fullName: faker.datatype.uuid(),
      active: faker.datatype.boolean(),
      startedAt: faker.date.recent(5),
      createdAt: faker.date.recent(2),
    };
  },
  {
    afterBuild: (model) => {
      return new BankTedEntity(model);
    },
  },
);

export const BankTedFactory = factory;
