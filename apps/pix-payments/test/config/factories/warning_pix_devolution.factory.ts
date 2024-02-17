// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { UserEntity } from '@zro/users/domain';
import { OperationEntity } from '@zro/operations/domain';
import {
  WarningPixDevolutionEntity,
  PixDevolutionCode,
  WarningPixDevolutionState,
  PixDepositEntity,
} from '@zro/pix-payments/domain';
import {
  PixDepositModel,
  WarningPixDevolutionModel,
} from '@zro/pix-payments/infrastructure';

/**
 * WarningPixDevolution factory.
 */
factory.define<WarningPixDevolutionModel>(
  WarningPixDevolutionModel.name,
  WarningPixDevolutionModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      userId: faker.datatype.uuid(),
      operationId: faker.datatype.uuid(),
      depositId: factory.assoc(PixDepositModel.name, 'id'),
      description: faker.datatype.string(),
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      devolutionCode: PixDevolutionCode.FRAUD,
      state: WarningPixDevolutionState.CONFIRMED,
      createdAt: faker.date.recent(99),
    };
  },
);

/**
 * WarningPixDevolution entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, WarningPixDevolutionEntity.name);

factory.define<WarningPixDevolutionEntity>(
  WarningPixDevolutionEntity.name,
  DefaultModel,
  async () => {
    return {
      id: faker.datatype.uuid(),
      state: WarningPixDevolutionState.CONFIRMED,
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      devolutionCode: PixDevolutionCode.FRAUD,
      description: faker.datatype.string(),
      user: new UserEntity({ uuid: faker.datatype.uuid() }),
      operation: new OperationEntity({ id: faker.datatype.uuid() }),
      deposit: new PixDepositEntity({ id: faker.datatype.uuid() }),
      createdAt: faker.date.recent(99),
    };
  },
  {
    afterBuild: (model) => {
      return new WarningPixDevolutionEntity(model);
    },
  },
);

export const WarningPixDevolutionFactory = factory;
