// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import {
  CryptoRemittanceEntity,
  ProviderEntity,
  RemittanceOrderEntity,
  RemittanceOrderSide,
  RemittanceOrderStatus,
  RemittanceOrderType,
  SettlementDateCode,
  SystemEntity,
} from '@zro/otc/domain';
import { RemittanceOrderModel } from '@zro/otc/infrastructure';
import { ProviderFactory } from './provider.factory';
import { SystemFactory } from './system.factory';
import { CurrencyFactory } from '@zro/test/operations/config';
import { CurrencyEntity } from '@zro/operations/domain';
import { CryptoRemittanceFactory } from './crypto_remittance.factory';

const fakerModel = () => ({
  id: faker.datatype.uuid(),
  side: RemittanceOrderSide.BUY,
  amount: faker.datatype.number({ min: 1, max: 999999 }),
  status: RemittanceOrderStatus.OPEN,
  type: RemittanceOrderType.CRYPTO,
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
});

/**
 * RemittanceOrder factory.
 */
factory.define<RemittanceOrderModel>(
  RemittanceOrderModel.name,
  RemittanceOrderModel,
  () => ({
    ...fakerModel(),
    currencyId: faker.datatype.number({ min: 1, max: 999999 }),
    systemId: faker.datatype.uuid(),
    providerId: faker.datatype.uuid(),
    cryptoRemittanceId: faker.datatype.uuid(),
    sendDateCode: SettlementDateCode.D0,
    receiveDateCode: SettlementDateCode.D0,
  }),
);

/**
 * RemittanceOrder entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, RemittanceOrderEntity.name);

factory.define<RemittanceOrderEntity>(
  RemittanceOrderEntity.name,
  DefaultModel,
  async () => {
    const currency = await CurrencyFactory.create<CurrencyEntity>(
      CurrencyEntity.name,
    );

    const system = await SystemFactory.create<SystemEntity>(SystemEntity.name);

    const provider = await ProviderFactory.create<ProviderEntity>(
      ProviderEntity.name,
    );

    const cryptoRemittance =
      await CryptoRemittanceFactory.create<CryptoRemittanceEntity>(
        CryptoRemittanceEntity.name,
      );

    return {
      ...fakerModel(),
      currency,
      system,
      provider,
      cryptoRemittance,
    };
  },
  {
    afterBuild: (model) => {
      return new RemittanceOrderEntity(model);
    },
  },
);

export const RemittanceOrderFactory = factory;
