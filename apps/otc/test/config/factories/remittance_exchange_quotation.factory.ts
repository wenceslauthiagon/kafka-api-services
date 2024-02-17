// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import {
  RemittanceExchangeQuotationEntity,
  RemittanceEntity,
  ExchangeQuotationEntity,
} from '@zro/otc/domain';
import {
  ExchangeQuotationModel,
  RemittanceExchangeQuotationModel,
  RemittanceModel,
} from '@zro/otc/infrastructure';
import {
  ExchangeQuotationFactory,
  RemittanceFactory,
} from '@zro/test/otc/config';

/**
 * Remittance Exchange Quotation factory.
 */
factory.define<RemittanceExchangeQuotationModel>(
  RemittanceExchangeQuotationModel.name,
  RemittanceExchangeQuotationModel,
  () => {
    return {
      remittanceId: factory.assoc(RemittanceModel.name, 'id'),
      exchangeQuotationId: factory.assoc(ExchangeQuotationModel.name, 'id'),
    };
  },
);

/**
 * Remittance Exchange Quotation entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, RemittanceExchangeQuotationEntity.name);

factory.define<RemittanceExchangeQuotationEntity>(
  RemittanceExchangeQuotationEntity.name,
  DefaultModel,
  async () => {
    return {
      id: faker.datatype.uuid(),
      remittance: await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
      ),
      exchangeQuotation:
        await ExchangeQuotationFactory.create<ExchangeQuotationEntity>(
          ExchangeQuotationEntity.name,
        ),
    };
  },
  {
    afterBuild: (model) => {
      return new RemittanceExchangeQuotationEntity(model);
    },
  },
);

export const RemittanceExchangeQuotationFactory = factory;
