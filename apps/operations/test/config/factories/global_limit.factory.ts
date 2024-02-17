// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import { GlobalLimitEntity, LimitTypeEntity } from '@zro/operations/domain';
import {
  GlobalLimitModel,
  LimitTypeModel,
} from '@zro/operations/infrastructure';
import { LimitTypeFactory } from '@zro/test/operations/config';

const fakerModel = () => ({
  dailyLimit: faker.datatype.number({ min: 1, max: 99999 }),
  monthlyLimit: faker.datatype.number({ min: 1, max: 99999 }),
  yearlyLimit: faker.datatype.number({ min: 1, max: 99999 }),
  nighttimeStart: '20:00',
  nighttimeEnd: '06:00',
});

/**
 * GlobalLimit factory.
 */
factory.define<GlobalLimitModel>(
  GlobalLimitModel.name,
  GlobalLimitModel,
  () => ({
    limitTypeId: factory.assoc(LimitTypeModel.name, 'id'),
    ...fakerModel(),
  }),
);

/**
 * GlobalLimit entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, GlobalLimitEntity.name);

factory.define<GlobalLimitEntity>(
  GlobalLimitEntity.name,
  DefaultModel,
  async () => ({
    id: faker.datatype.uuid(),
    limitType: await LimitTypeFactory.create<LimitTypeEntity>(
      LimitTypeEntity.name,
    ),
    ...fakerModel(),
  }),
  {
    afterBuild: (model) => {
      return new GlobalLimitEntity(model);
    },
  },
);

export const GlobalLimitFactory = factory;
