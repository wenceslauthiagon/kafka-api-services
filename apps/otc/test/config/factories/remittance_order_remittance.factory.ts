// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import {
  RemittanceEntity,
  RemittanceOrderEntity,
  RemittanceOrderRemittanceEntity,
} from '@zro/otc/domain';
import {
  RemittanceModel,
  RemittanceOrderModel,
  RemittanceOrderRemittanceModel,
} from '@zro/otc/infrastructure';
import { RemittanceOrderFactory } from './remittance_order.factory';
import { RemittanceFactory } from './remittance.factory';

const fakerModel = () => ({
  id: faker.datatype.uuid(),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
});

/**
 * RemittanceOrderRemittance factory.
 */
factory.define<RemittanceOrderRemittanceModel>(
  RemittanceOrderRemittanceModel.name,
  RemittanceOrderRemittanceModel,
  () => ({
    ...fakerModel(),
    remittanceOrderId: factory.assoc(RemittanceOrderModel.name, 'id'),
    remittanceId: factory.assoc(RemittanceModel.name, 'id'),
  }),
);

/**
 * RemittanceOrderRemittance entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, RemittanceOrderRemittanceEntity.name);

factory.define<RemittanceOrderRemittanceEntity>(
  RemittanceOrderRemittanceEntity.name,
  DefaultModel,
  async () => {
    const remittanceOrder =
      await RemittanceOrderFactory.create<RemittanceOrderEntity>(
        RemittanceOrderEntity.name,
      );

    const remittance = await RemittanceFactory.create<RemittanceEntity>(
      RemittanceEntity.name,
    );

    return { ...fakerModel(), remittanceOrder, remittance };
  },
  {
    afterBuild: (model) => {
      return new RemittanceOrderRemittanceEntity(model);
    },
  },
);

export const RemittanceOrderRemittanceFactory = factory;
