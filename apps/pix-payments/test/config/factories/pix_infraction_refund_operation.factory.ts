// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import {
  PixInfractionEntity,
  PixInfractionRefundOperationEntity,
  PixInfractionRefundOperationState,
} from '@zro/pix-payments/domain';
import { OperationEntity } from '@zro/operations/domain';
import { PixInfractionRefundOperationModel } from '@zro/pix-payments/infrastructure';
import { UserFactory } from '@zro/test/users/config';
import { UserEntity } from '@zro/users/domain';
import { InfractionFactory } from '@zro/test/pix-payments/config';

const fakerModel = () => ({
  id: faker.datatype.uuid(),
  state: PixInfractionRefundOperationState.OPEN,
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
});

/**
 * PixInfractionRefundOperation model factory.
 */
factory.define<PixInfractionRefundOperationModel>(
  PixInfractionRefundOperationModel.name,
  PixInfractionRefundOperationModel,
  () => {
    return {
      ...fakerModel(),
      userId: faker.datatype.uuid(),
      pixInfractionId: faker.datatype.uuid(),
      originalOperationId: faker.datatype.uuid(),
      originalOperationValue: faker.datatype.number({ min: 1, max: 99999 }),
      refundOperationId: faker.datatype.uuid(),
      refundOperationValue: faker.datatype.number({ min: 1, max: 99999 }),
    };
  },
);

/**
 * PixInfractionRefundOperation entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, PixInfractionRefundOperationEntity.name);

factory.define<PixInfractionRefundOperationEntity>(
  PixInfractionRefundOperationEntity.name,
  DefaultModel,
  async () => {
    return {
      ...fakerModel(),
      user: await UserFactory.create<UserEntity>(UserEntity.name),
      pixInfraction: await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
      ),
      originalOperation: new OperationEntity({
        id: faker.datatype.uuid(),
        value: faker.datatype.number({ min: 1, max: 99999 }),
      }),
      refundOperation: new OperationEntity({
        id: faker.datatype.uuid(),
        value: faker.datatype.number({ min: 1, max: 99999 }),
      }),
    };
  },
  {
    afterBuild: (model) => {
      return new PixInfractionRefundOperationEntity(model);
    },
  },
);

export const PixInfractionRefundOperationFactory = factory;
