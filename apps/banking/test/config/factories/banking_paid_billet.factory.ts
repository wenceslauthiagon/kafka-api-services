// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import { BankingPaidBilletEntity } from '@zro/banking/domain';
import { OperationEntity } from '@zro/operations/domain';
import { BankingPaidBilletModel } from '@zro/banking/infrastructure';
import { OperationFactory } from '@zro/test/operations/config';

const fakerModel = () => ({
  id: faker.datatype.number({ min: 1, max: 999 }),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
});

/**
 * BankingPaidBillet model factory.
 */
factory.define<BankingPaidBilletModel>(
  BankingPaidBilletModel.name,
  BankingPaidBilletModel,
  () => ({
    ...fakerModel(),
    operationId: faker.datatype.uuid(),
  }),
);

/**
 * BankingPaidBillet entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, BankingPaidBilletEntity.name);

factory.define<BankingPaidBilletEntity>(
  BankingPaidBilletEntity.name,
  DefaultModel,
  async () => {
    const operation = await OperationFactory.create<OperationEntity>(
      OperationEntity.name,
    );

    return Object.assign({}, fakerModel(), { operation });
  },
  {
    afterBuild: (model) => {
      return new BankingPaidBilletEntity(model);
    },
  },
);

export const BankingPaidBilletFactory = factory;
