// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import {
  PixDepositEntity,
  PixDevolutionCode,
  PixRefundDevolutionEntity,
  PixRefundDevolutionState,
  PixRefundDevolutionTransactionType,
} from '@zro/pix-payments/domain';
import { UserEntity } from '@zro/users/domain';
import { OperationEntity } from '@zro/operations/domain';
import {
  PixDepositModel,
  PixRefundDevolutionModel,
} from '@zro/pix-payments/infrastructure';

/**
 * PixRefundDevolution factory.
 */
factory.define<PixRefundDevolutionModel>(
  PixRefundDevolutionModel.name,
  PixRefundDevolutionModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      userId: faker.datatype.uuid(),
      operationId: faker.datatype.uuid(),
      transactionType: PixRefundDevolutionTransactionType.DEPOSIT,
      transactionId: factory.assoc(PixDepositModel.name, 'id'),
      description: faker.datatype.string(),
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      devolutionCode: PixDevolutionCode.FRAUD,
      state: PixRefundDevolutionState.CONFIRMED,
      createdAt: faker.date.recent(),
    };
  },
);

/**
 * PixRefundDevolution entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, PixRefundDevolutionEntity.name);

factory.define<PixRefundDevolutionEntity>(
  PixRefundDevolutionEntity.name,
  DefaultModel,
  async () => {
    return {
      id: faker.datatype.uuid(),
      user: new UserEntity({ uuid: faker.datatype.uuid() }),
      operation: new OperationEntity({ id: faker.datatype.uuid() }),
      transactionType: PixRefundDevolutionTransactionType.DEPOSIT,
      transaction: new PixDepositEntity({
        id: faker.datatype.uuid(),
        endToEndId: faker.datatype.uuid(),
      }),
      description: faker.datatype.string(),
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      devolutionCode: PixDevolutionCode.FRAUD,
      state: PixRefundDevolutionState.CONFIRMED,
      createdAt: faker.date.recent(),
    };
  },
  {
    afterBuild: (model) => {
      return new PixRefundDevolutionEntity(model);
    },
  },
);

export const PixRefundDevolutionFactory = factory;
