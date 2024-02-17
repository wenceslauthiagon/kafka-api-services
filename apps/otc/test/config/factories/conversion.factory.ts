// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf } from 'cpf-cnpj-validator';
import { DefaultModel } from '@zro/common/test';
import {
  ConversionEntity,
  OrderSide,
  ProviderEntity,
  RemittanceEntity,
} from '@zro/otc/domain';
import { UserEntity } from '@zro/users/domain';
import { QuotationEntity } from '@zro/quotations/domain';
import { CurrencyEntity, OperationEntity } from '@zro/operations/domain';
import { ConversionModel, ProviderModel } from '@zro/otc/infrastructure';
import { CurrencyFactory, OperationFactory } from '@zro/test/operations/config';
import { RemittanceFactory, ProviderFactory } from '@zro/test/otc/config';
import { UserFactory } from '@zro/test/users/config';
import { QuotationFactory } from '@zro/test/quotations/config';

const fakerModel = () => ({
  id: faker.datatype.uuid(),
  conversionType: OrderSide.BUY,
  clientName: faker.random.word(),
  clientDocument: cpf.generate(),
  fiatAmount: faker.datatype.number({ min: 1, max: 999999 }),
  usdAmount: faker.datatype.number({ min: 1, max: 999999 }),
  amount: faker.datatype.number({ min: 1, max: 999999 }),
  usdQuote: faker.datatype.number({ min: 1, max: 999999 }),
  quote: faker.random.word(),
  tradeId: faker.datatype.uuid(),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
});

/**
 * Conversion model factory.
 */
factory.define<ConversionModel>(ConversionModel.name, ConversionModel, () => ({
  ...fakerModel(),
  operationId: faker.datatype.uuid(),
  quotationId: faker.datatype.uuid(),
  userUUID: faker.datatype.uuid(),
  currencyId: faker.datatype.number({ min: 1, max: 999999 }),
  remittanceId: faker.datatype.uuid(),
  providerId: factory.assoc(ProviderModel.name, 'id'),
}));

/**
 * Conversion entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, ConversionEntity.name);

factory.define<ConversionEntity>(
  ConversionEntity.name,
  DefaultModel,
  async () => {
    const currency = await CurrencyFactory.create<CurrencyEntity>(
      CurrencyEntity.name,
    );
    const operation = await OperationFactory.create<OperationEntity>(
      OperationEntity.name,
    );
    const quotation = await QuotationFactory.create<QuotationEntity>(
      QuotationEntity.name,
    );
    const remittance = await RemittanceFactory.create<RemittanceEntity>(
      RemittanceEntity.name,
    );
    const user = await UserFactory.create<UserEntity>(UserEntity.name);
    const provider = await ProviderFactory.create<ProviderEntity>(
      ProviderEntity.name,
    );

    return Object.assign({}, fakerModel(), {
      currency,
      operation,
      quotation,
      remittance,
      user,
      provider,
    });
  },
  {
    afterBuild: (model) => {
      return new ConversionEntity(model);
    },
  },
);

export const ConversionFactory = factory;
