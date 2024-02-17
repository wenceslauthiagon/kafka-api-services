// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import { BankEntity } from '@zro/banking/domain';
import { BankModel } from '@zro/banking/infrastructure';

/**
 * Bank factory.
 */
factory.define<BankModel>(BankModel.name, BankModel, () => {
  return {
    id: faker.datatype.uuid(),
    ispb: faker.datatype.number(999999).toString().padStart(8, '0'),
    code: faker.datatype.uuid(),
    name: faker.datatype.uuid(),
    fullName: faker.datatype.uuid(),
    active: faker.datatype.boolean(),
    startedAt: faker.date.recent(5),
    createdAt: faker.date.recent(2),
  };
});

const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, BankEntity.name);

factory.define<BankEntity>(
  BankEntity.name,
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
      return new BankEntity(model);
    },
  },
);

export const BankFactory = factory;
