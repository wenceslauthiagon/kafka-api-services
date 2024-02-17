// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { TransactionModel } from '@zro/pix-zro-pay/infrastructure';
import {
  BankAccountEntity,
  ClientEntity,
  CompanyEntity,
  TransactionEntity,
  TransactionPaymentType,
  TransactionProcessStatus,
  TransactionStatus,
  TransactionType,
} from '@zro/pix-zro-pay/domain';

const fakerModel = () => ({
  paymentType: TransactionPaymentType.PIX,
  valueCents: faker.datatype.number(),
  feeValue: faker.datatype.number(),
  feeInPercent: faker.datatype.number(),
  totalFee: faker.datatype.number(),
  status: TransactionStatus.PENDING,
  transactionType: TransactionType.TRANSACTION,
  zroTotalValueInCents: faker.datatype.number(),
  mainCompanyTotalFeeCents: faker.datatype.number(),
  processStatus: TransactionProcessStatus.WAITING,
});

/**
 * Transaction model factory.
 */
factory.define<TransactionModel>(
  TransactionModel.name,
  TransactionModel,
  () => {
    return {
      ...fakerModel(),
      clientId: faker.datatype.number(),
      companyId: faker.datatype.number(),
      bankId: faker.datatype.number(),
    };
  },
);

/**
 * Transaction entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, TransactionEntity.name);

factory.define<TransactionEntity>(
  TransactionEntity.name,
  DefaultModel,
  () => {
    return {
      id: faker.datatype.number({ min: 1, max: 999999 }),
      bankAccount: new BankAccountEntity({
        id: faker.datatype.number({ min: 1, max: 99999 }),
      }),
      company: new CompanyEntity({
        id: faker.datatype.number({ min: 1, max: 99999 }),
      }),
      client: new ClientEntity({
        id: faker.datatype.number({ min: 1, max: 99999 }),
      }),
      ...fakerModel(),
    };
  },
  {
    afterBuild: (model) => {
      return new TransactionEntity(model);
    },
  },
);

export const TransactionFactory = factory;
