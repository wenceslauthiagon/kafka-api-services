// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import {
  WarningPixDepositEntity,
  WarningPixDepositState,
} from '@zro/pix-payments/domain';
import { UserEntity } from '@zro/users/domain';
import { OperationEntity } from '@zro/operations/domain';
import { WarningPixDepositModel } from '@zro/pix-payments/infrastructure';
import { UserFactory } from '@zro/test/users/config';

const statesArray = Object.values(WarningPixDepositState);

const fakerModel = () => ({
  id: faker.datatype.uuid(),
  state:
    statesArray[faker.datatype.number({ min: 0, max: statesArray.length - 1 })],
  transactionTag: faker.random.words(),
  rejectedReason: faker.random.words(),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
});

/**
 * Warning Deposit factory.
 */
factory.define<WarningPixDepositModel>(
  WarningPixDepositModel.name,
  WarningPixDepositModel,
  () => ({
    ...fakerModel(),
    userId: faker.datatype.uuid(),
    operationId: faker.datatype.uuid(),
  }),
);

/**
 * Warning Deposit entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, WarningPixDepositEntity.name);

factory.define<WarningPixDepositEntity>(
  WarningPixDepositEntity.name,
  DefaultModel,
  async () => ({
    ...fakerModel(),
    operation: new OperationEntity({ id: faker.datatype.uuid() }),
    user: await UserFactory.create<UserEntity>(UserEntity.name),
  }),
  {
    afterBuild: (model) => {
      return new WarningPixDepositEntity(model);
    },
  },
);

export const WarningPixDepositFactory = factory;
