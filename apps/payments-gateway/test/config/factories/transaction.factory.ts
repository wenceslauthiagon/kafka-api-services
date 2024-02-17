// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf } from 'cpf-cnpj-validator';
import { DefaultModel } from '@zro/common/test';
import { TransactionEntity } from '@zro/payments-gateway/domain';
import { OperationType } from '@zro/reports/domain';
import { PersonType } from '@zro/users/domain';
import { getMoment } from '@zro/common';

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
      page: 1,
      size: 1,
      createdDate: getMoment().format('YYYY-MM-DD'),
      ttl: 1000,
      transactions: [
        {
          operationId: faker.datatype.uuid(),
          operationDate: new Date(),
          operationValue: faker.datatype.number({ min: 1, max: 99999 }),
          operationType: OperationType.C,
          transactionTypeTag: 'PIXSEND',
          thirdPartName: faker.datatype.string(),
          thirdPartDocument: cpf.generate(),
          thirdPartTypeDocument: PersonType.NATURAL_PERSON,
          clientName: faker.datatype.string(),
          clientDocument: cpf.generate(),
          clientTypeDocument: PersonType.NATURAL_PERSON,
          clientBankCode: faker.datatype
            .number(999999)
            .toString()
            .padStart(8, '0'),
          clientBranch: faker.datatype.number(9999).toString().padStart(4, '0'),
          clientAccountNumber: faker.datatype.uuid(),
          currencySymbol: 'REAL',
        },
      ],
    };
  },
  {
    afterBuild: (model) => {
      return new TransactionEntity(model);
    },
  },
);

export const TransactionFactory = factory;
