// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';

import { DefaultModel } from '@zro/common/test';
import { PlanModel } from '@zro/pix-zro-pay/infrastructure';
import { PlanEntity } from '@zro/pix-zro-pay/domain';

const fakerModel = () => ({
  id: faker.datatype.number(),
  name: faker.datatype.string(),
  feeCashinInCents: faker.datatype.number({ min: 1, max: 999 }),
  feeCashinInPercent: faker.datatype.number({ min: 0, max: 100 }),
  feeCashoutInCents: faker.datatype.number({ min: 1, max: 999 }),
  feeCashoutInPercent: faker.datatype.number({ min: 0, max: 100 }),
  feeRefundInCents: faker.datatype.number({ min: 1, max: 999 }),
  feeRefundInPercent: faker.datatype.number({ min: 1, max: 999 }),
  onHoldTimeInHours: faker.datatype.number({ min: 1, max: 999 }),
  qrCodeMinValueInCents: faker.datatype.number({ min: 1, max: 1 }),
  qrCodeMaxValueInCents: faker.datatype.number({ min: 999, max: 999 }),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
});

/**
 * Plan model factory.
 */
factory.define<PlanModel>(PlanModel.name, PlanModel, () => {
  return fakerModel();
});

/**
 * Plan entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, PlanEntity.name);

factory.define<PlanEntity>(
  PlanEntity.name,
  DefaultModel,
  async () => {
    return fakerModel();
  },
  {
    afterBuild: (model) => {
      return new PlanEntity(model);
    },
  },
);

export const PlanFactory = factory;
