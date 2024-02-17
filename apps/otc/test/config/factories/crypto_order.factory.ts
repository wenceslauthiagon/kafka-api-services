// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import { CurrencyEntity } from '@zro/operations/domain';
import { QuotationEntity } from '@zro/quotations/domain';
import {
  CryptoOrderEntity,
  CryptoOrderState,
  OrderType,
  OrderSide,
  SystemEntity,
} from '@zro/otc/domain';
import { CryptoOrderModel, SystemModel } from '@zro/otc/infrastructure';
import { SystemFactory } from '@zro/test/otc/config';
import { CurrencyFactory } from '@zro/test/operations/config';
import { QuotationFactory } from '@zro/test/quotations/config';

const fakerModel = () => ({
  id: faker.datatype.uuid(),
  amount: faker.datatype.number({ min: 1, max: 99999 }),
  type: OrderType.LIMIT,
  side: OrderSide.BUY,
  createdAt: faker.date.recent(),
  state: CryptoOrderState.PENDING,
  userId: faker.datatype.uuid(),
});

/**
 * Crypto Orders factory.
 */
factory.define<CryptoOrderModel>(
  CryptoOrderModel.name,
  CryptoOrderModel,
  () => ({
    ...fakerModel(),
    quoteCurrencyId: faker.datatype.number({ min: 1, max: 999999 }),
    baseCurrencyId: faker.datatype.number({ min: 1, max: 999999 }),
    quotationId: faker.datatype.uuid(),
    systemId: factory.assoc(SystemModel.name, 'id'),
  }),
);

/**
 * Crypto Orders entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, CryptoOrderEntity.name);

factory.define<CryptoOrderEntity>(
  CryptoOrderEntity.name,
  DefaultModel,
  async () => {
    const quoteCurrency = await CurrencyFactory.create<CurrencyEntity>(
      CurrencyEntity.name,
    );
    const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
      CurrencyEntity.name,
    );
    const quotation = await QuotationFactory.create<QuotationEntity>(
      QuotationEntity.name,
    );
    const system = await SystemFactory.create<SystemEntity>(SystemEntity.name);

    return {
      ...fakerModel(),
      quoteCurrency,
      baseCurrency,
      quotation,
      system,
    };
  },
  {
    afterBuild: (model) => {
      return new CryptoOrderEntity(model);
    },
  },
);

export const CryptoOrderFactory = factory;
