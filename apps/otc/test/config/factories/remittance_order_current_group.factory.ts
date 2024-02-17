// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import {
  RemittanceOrderCurrentGroupEntity,
  SettlementDateCode,
} from '@zro/otc/domain';
import { CurrencyFactory } from '@zro/test/operations/config';
import { CurrencyEntity } from '@zro/operations/domain';
import { getMoment } from '@zro/common';

/**
 * RemittanceOrderCurrentGroup entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, RemittanceOrderCurrentGroupEntity.name);

factory.define<RemittanceOrderCurrentGroupEntity>(
  RemittanceOrderCurrentGroupEntity.name,
  DefaultModel,
  async () => {
    return {
      currency: await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      ),
      groupAmount: faker.datatype.number({ min: -4999, max: 4999 }),
      groupAmountDate: getMoment().toDate(),
      dailyAmount: faker.datatype.number({ min: -4999, max: 4999 }),
      dailyAmountDate: getMoment().toDate(),
      remittanceOrderGroup: [faker.datatype.uuid()],
      sendDateCode: SettlementDateCode.D0,
      receiveDateCode: SettlementDateCode.D0,
    };
  },
  {
    afterBuild: (model) => {
      return new RemittanceOrderCurrentGroupEntity(model);
    },
  },
);

export const RemittanceOrderCurrentGroupFactory = factory;
