// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf } from 'cpf-cnpj-validator';
import { DefaultModel } from '@zro/common/test';
import { AccountType } from '@zro/pix-payments/domain';
import {
  NotifyCompletionEntity,
  NotifyStateType,
  StatusType,
} from '@zro/api-topazio/domain';
import { NotifyCompletionModel } from '@zro/api-topazio/infrastructure';

/**
 * NotifyCompletion factory.
 */
factory.define<NotifyCompletionModel>(
  NotifyCompletionModel.name,
  NotifyCompletionModel,
  () => {
    return {
      transactionId: faker.datatype.uuid(),
      isDevolution: true,
      status: StatusType.COMPLETED,
      txId: faker.datatype.uuid(),
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      clientIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      clientBranch: faker.datatype.number(9999).toString().padStart(4, '0'),
      clientAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(5, '0'),
      clientDocument: cpf.generate(),
      clientName: faker.name.fullName(),
      clientKey: faker.datatype.uuid(),
      thirdPartIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      thirdPartBranch: faker.datatype.number(9999).toString().padStart(4, '0'),
      thirdPartAccountType: AccountType.CACC,
      thirdPartAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(5, '0'),
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
 * NotifyCompletion entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, NotifyCompletionEntity.name);

factory.define<NotifyCompletionEntity>(
  NotifyCompletionEntity.name,
  DefaultModel,
  async () => {
    return {
      transactionId: faker.datatype.uuid(),
      isDevolution: true,
      status: StatusType.COMPLETED,
      txId: faker.datatype.uuid(),
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      clientIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      clientBranch: faker.datatype.number(9999).toString().padStart(4, '0'),
      clientAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(5, '0'),
      clientDocument: cpf.generate(),
      clientName: faker.name.fullName(),
      clientKey: faker.datatype.uuid(),
      thirdPartIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      thirdPartBranch: faker.datatype.number(9999).toString().padStart(4, '0'),
      thirdPartAccountType: AccountType.CACC,
      thirdPartAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(5, '0'),
      thirdPartDocument: cpf.generate(),
      thirdPartName: faker.datatype.uuid(),
      thirdPartKey: faker.datatype.uuid(),
      endToEndId: faker.datatype.uuid(),
      description: faker.datatype.uuid(),
    };
  },
  {
    afterBuild: (model) => {
      return new NotifyCompletionEntity(model);
    },
  },
);

export const NotifyCompletionFactory = factory;
