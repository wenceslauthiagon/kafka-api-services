// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf } from 'cpf-cnpj-validator';
import { DefaultModel } from '@zro/common/test';
import {
  InitiationType,
  NotifyCreditDepositEntity,
  PaymentPriorityLevelType,
  NotifyStateType,
} from '@zro/api-jdpi/domain';
import { PersonType } from '@zro/users/domain';
import { AccountType, PaymentPriorityType } from '@zro/pix-payments/domain';
import { NotifyCreditDepositModel } from '@zro/api-jdpi/infrastructure';

/**
 * NotifyCreditDeposit factory.
 */
factory.define<NotifyCreditDepositModel>(
  NotifyCreditDepositModel.name,
  NotifyCreditDepositModel,
  () => {
    return {
      externalId: faker.datatype.uuid(),
      endToEndId: faker.datatype.string(),
      initiationType: InitiationType.KEY,
      paymentPriorityType: PaymentPriorityType.PRIORITY,
      paymentPriorityLevelType: PaymentPriorityLevelType.PRIORITY_PAYMENT,
      finalityType: faker.datatype.number({ min: 0, max: 2 }),
      thirdPartIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      thirdPartPersonType: PersonType.LEGAL_PERSON,
      thirdPartDocument: cpf.generate(),
      thirdPartAccountType: AccountType.CACC,
      thirdPartAccountNumber: faker.datatype
        .number(999999)
        .toString()
        .padStart(8, '0'),
      thirdPartName: faker.name.fullName(),
      clientIspb: faker.datatype.number(9999999).toString().padStart(8, '0'),
      clientPersonType: PersonType.LEGAL_PERSON,
      clientDocument: cpf.generate(),
      clientAccountType: AccountType.CACC,
      createdAt: new Date(),
      state: NotifyStateType.READY,
      clientAccountNumber: faker.datatype
        .number(9999999)
        .toString()
        .padStart(8, '0'),
      amount: faker.datatype.number({ min: 1, max: 99999 }),
    };
  },
);

/**
 * NotifyCreditDeposit entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, NotifyCreditDepositEntity.name);

factory.define<NotifyCreditDepositEntity>(
  NotifyCreditDepositEntity.name,
  DefaultModel,
  async () => {
    return {
      externalId: faker.datatype.uuid(),
      endToEndId: faker.datatype.uuid(),
      initiationType: InitiationType.KEY,
      paymentPriorityType: PaymentPriorityType.PRIORITY,
      paymentPriorityLevelType: PaymentPriorityLevelType.PRIORITY_PAYMENT,
      finalityType: faker.datatype.number({ min: 0, max: 2 }),
      thirdPartIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      thirdPartPersonType: PersonType.LEGAL_PERSON,
      thirdPartDocument: cpf.generate(),
      thirdPartAccountType: AccountType.CACC,
      thirdPartAccountNumber: faker.datatype
        .number(999999)
        .toString()
        .padStart(8, '0'),
      thirdPartName: faker.name.fullName(),
      clientIspb: faker.datatype.number(9999999).toString().padStart(8, '0'),
      clientPersonType: PersonType.LEGAL_PERSON,
      clientDocument: cpf.generate(),
      clientAccountType: AccountType.CACC,
      clientAccountNumber: faker.datatype
        .number(9999999)
        .toString()
        .padStart(8, '0'),
      createdAt: new Date(),
      amount: faker.datatype.number({ min: 1, max: 99999 }),
    };
  },
  {
    afterBuild: (model) => {
      return new NotifyCreditDepositEntity(model);
    },
  },
);

export const NotifyCreditDepositFactory = factory;
