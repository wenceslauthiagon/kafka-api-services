// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { UserEntity } from '@zro/users/domain';
import { OperationEntity, WalletEntity } from '@zro/operations/domain';
import {
  PixDevolutionEntity,
  PixDevolutionCode,
  PixDevolutionState,
  PixDepositEntity,
} from '@zro/pix-payments/domain';
import {
  PixDepositModel,
  PixDevolutionModel,
} from '@zro/pix-payments/infrastructure';

/**
 * PixDevolution factory.
 */
factory.define<PixDevolutionModel>(
  PixDevolutionModel.name,
  PixDevolutionModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      userId: faker.datatype.uuid(),
      walletId: faker.datatype.uuid(),
      operationId: faker.datatype.uuid(),
      depositId: factory.assoc(PixDepositModel.name, 'id'),
      description: faker.datatype.string(),
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      devolutionCode: PixDevolutionCode.ORIGINAL,
      state: PixDevolutionState.CONFIRMED,
      createdAt: faker.datatype.datetime(),
    };
  },
);

/**
 * PixDevolution entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, PixDevolutionEntity.name);

factory.define<PixDevolutionEntity>(
  PixDevolutionEntity.name,
  DefaultModel,
  async () => {
    return {
      id: faker.datatype.uuid(),
      state: PixDevolutionState.CONFIRMED,
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      devolutionCode: PixDevolutionCode.ORIGINAL,
      description: faker.datatype.string(),
      user: new UserEntity({ uuid: faker.datatype.uuid() }),
      wallet: new WalletEntity({ uuid: faker.datatype.uuid() }),
      operation: new OperationEntity({ id: faker.datatype.uuid() }),
      deposit: new PixDepositEntity({ id: faker.datatype.uuid() }),
      createdAt: faker.date.recent(99),
    };
  },
  {
    afterBuild: (model) => {
      return new PixDevolutionEntity(model);
    },
  },
);

export const PixDevolutionFactory = factory;
