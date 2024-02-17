// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf } from 'cpf-cnpj-validator';
import { DefaultModel } from '@zro/common';
import { BankingTedReceivedEntity } from '@zro/banking/domain';
import { OperationEntity } from '@zro/operations/domain';
import { BankingTedReceivedModel } from '@zro/banking/infrastructure';

const fakerModel = () => ({
  id: faker.datatype.number({ min: 1, max: 999999 }),
  transactionId: faker.datatype.uuid(),
  ownerName: faker.name.firstName(),
  ownerDocument: cpf.generate(),
  ownerBankAccount: faker.datatype.number({ min: 1, max: 999999 }).toString(),
  ownerBankBranch: faker.datatype
    .number({ min: 1, max: 9999 })
    .toString()
    .padStart(4, '0'),
  ownerBankCode: faker.datatype
    .number({ min: 1, max: 999 })
    .toString()
    .padStart(3, '0'),
  ownerBankName: faker.company.name(),
  bankStatementId: faker.datatype.uuid(),
  notifiedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
});

/**
 * BankingTedReceived factory.
 */
factory.define<BankingTedReceivedModel>(
  BankingTedReceivedModel.name,
  BankingTedReceivedModel,
  () => ({
    ...fakerModel(),
    operationId: faker.datatype.uuid(),
  }),
);

const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, BankingTedReceivedEntity.name);

factory.define<BankingTedReceivedEntity>(
  BankingTedReceivedEntity.name,
  DefaultModel,
  () => ({
    ...fakerModel(),
    operation: new OperationEntity({ id: faker.datatype.uuid() }),
  }),
  {
    afterBuild: (model) => {
      return new BankingTedReceivedEntity(model);
    },
  },
);

export const BankingTedReceivedFactory = factory;
