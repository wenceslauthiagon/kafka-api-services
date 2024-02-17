// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import {
  RemittanceEntity,
  RemittanceSide,
  RemittanceStatus,
  RemittanceType,
  SettlementDateCode,
  SystemEntity,
} from '@zro/otc/domain';
import { CurrencyEntity } from '@zro/operations/domain';
import { RemittanceModel } from '@zro/otc/infrastructure';
import { CurrencyFactory } from '@zro/test/operations/config';
import { SystemFactory } from './system.factory';

const fakerModel = () => ({
  id: faker.datatype.uuid(),
  side: RemittanceSide.BUY,
  type: RemittanceType.CRYPTO,
  amount: faker.datatype.number({ min: 1, max: 999999 }),
  resultAmount: faker.datatype.number({ min: 1, max: 999999 }),
  status: RemittanceStatus.OPEN,
  receiveDate: new Date(),
  sendDate: new Date(),
  sendDateCode: SettlementDateCode.D0,
  receiveDateCode: SettlementDateCode.D0,
  createdAt: new Date(),
  updatedAt: new Date(),
});

/**
 * Remittance factory.
 */
factory.define<RemittanceModel>(RemittanceModel.name, RemittanceModel, () => {
  return {
    ...fakerModel(),
    currencyId: faker.datatype.number({ min: 1, max: 9 }),
    systemId: faker.datatype.uuid(),
    exchangeContractId: faker.datatype.uuid(),
  };
});

/**
 * Remittance entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, RemittanceEntity.name);

factory.define<RemittanceEntity>(
  RemittanceEntity.name,
  DefaultModel,
  async () => {
    const currency = await CurrencyFactory.create<CurrencyEntity>(
      CurrencyEntity.name,
    );

    const system = await SystemFactory.create<SystemEntity>(SystemEntity.name);

    return Object.assign({}, fakerModel(), { currency, system });
  },
  {
    afterBuild: (model) => {
      return new RemittanceEntity(model);
    },
  },
);

export const RemittanceFactory = factory;
