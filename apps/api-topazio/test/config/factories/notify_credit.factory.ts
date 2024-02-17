// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf } from 'cpf-cnpj-validator';
import { DefaultModel } from '@zro/common/test';
import { AccountType } from '@zro/pix-payments/domain';
import {
  TransactionType,
  OperationType,
  StatusType,
  NotifyStateType,
  NotifyCreditEntity,
} from '@zro/api-topazio/domain';
import { NotifyCreditModel } from '@zro/api-topazio/infrastructure';

/**
 * NotifyCredit factory.
 */
factory.define<NotifyCreditModel>(
  NotifyCreditModel.name,
  NotifyCreditModel,
  () => {
    return {
      transactionId: faker.datatype.uuid(),
      transactionType: TransactionType.CREDIT,
      isDevolution: faker.datatype.boolean(),
      operation: OperationType.CREDIT,
      status: StatusType.ERROR,
      statusMessage: faker.datatype.uuid(),
      transactionOriginalID: faker.datatype.uuid(),
      reason: faker.datatype.uuid(),
      txId: faker.datatype.uuid(),
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      clientIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      clientBranch: faker.datatype.number(9999).toString().padStart(4, '0'),
      clientAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      clientDocument: cpf.generate(),
      clientName: faker.name.fullName(),
      clientKey: faker.datatype.uuid(),
      thirdPartIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      thirdPartBranch: faker.datatype.number(9999).toString().padStart(4, '0'),
      thirdPartAccountType: AccountType.CACC,
      thirdPartAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      thirdPartDocument: cpf.generate(),
      thirdPartName: faker.datatype.uuid(),
      thirdPartKey: faker.datatype.uuid(),
      endToEndId: faker.datatype.uuid(),
      description: faker.datatype.uuid(),
      state: NotifyStateType.READY,
    };
  },
);

/**
 * NotifyCredit entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, NotifyCreditEntity.name);

factory.define<NotifyCreditEntity>(
  NotifyCreditEntity.name,
  DefaultModel,
  async () => {
    return {
      transactionId: faker.datatype.uuid(),
      transactionType: TransactionType.CREDIT,
      isDevolution: faker.datatype.boolean(),
      operation: OperationType.CREDIT,
      status: StatusType.ERROR,
      statusMessage: faker.datatype.uuid(),
      transactionOriginalID: faker.datatype.uuid(),
      reason: faker.datatype.uuid(),
      txId: faker.datatype.uuid(),
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      clientIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      clientBranch: faker.datatype.number(9999).toString().padStart(4, '0'),
      clientAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      clientDocument: cpf.generate(),
      clientName: faker.name.fullName(),
      clientKey: faker.datatype.uuid(),
      thirdPartIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      thirdPartBranch: faker.datatype.number(9999).toString().padStart(4, '0'),
      thirdPartAccountType: AccountType.CACC,
      thirdPartAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      thirdPartDocument: cpf.generate(),
      thirdPartName: faker.datatype.uuid(),
      thirdPartKey: faker.datatype.uuid(),
      endToEndId: faker.datatype.uuid(),
      description: faker.datatype.uuid(),
    };
  },
  {
    afterBuild: (model) => {
      return new NotifyCreditEntity(model);
    },
  },
);

export const NotifyCreditFactory = factory;
