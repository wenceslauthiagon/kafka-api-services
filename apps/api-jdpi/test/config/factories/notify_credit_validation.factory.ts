// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf } from 'cpf-cnpj-validator';
import { DefaultModel } from '@zro/common/test';
import {
  NotifyCreditValidationEntity,
  PaymentPriorityLevelType,
  InitiationType,
  NotifyCreditValidationState,
  ResultType,
} from '@zro/api-jdpi/domain';
import { PersonType } from '@zro/users/domain';
import { AccountType, PaymentPriorityType } from '@zro/pix-payments/domain';
import { NotifyCreditValidationModel } from '@zro/api-jdpi/infrastructure';

/**
 * NotifyCreditValidation factory.
 */
factory.define<NotifyCreditValidationModel>(
  NotifyCreditValidationModel.name,
  NotifyCreditValidationModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      initiationType: InitiationType.KEY,
      paymentPriorityType: PaymentPriorityType.PRIORITY,
      paymentPriorityLevelType: PaymentPriorityLevelType.PRIORITY_PAYMENT,
      finalityType: faker.datatype.number({ min: 0, max: 2 }),
      thirdPartIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      thirdPartPersonType: PersonType.LEGAL_PERSON,
      thirdPartDocument: cpf.generate(),
      thirdPartName: faker.name.fullName(),
      thirdPartAccountType: AccountType.CACC,
      thirdPartAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      clientIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      clientPersonType: PersonType.LEGAL_PERSON,
      clientDocument: cpf.generate(),
      clientAccountType: AccountType.CACC,
      clientAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      createdAt: faker.date.past(),
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      state: NotifyCreditValidationState.READY,
      responseResultType: ResultType.VALID,
      responseCreatedAt: faker.date.past(),
    };
  },
);

/**
 * NotifyCreditValidation entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, NotifyCreditValidationEntity.name);

factory.define<NotifyCreditValidationEntity>(
  NotifyCreditValidationEntity.name,
  DefaultModel,
  async () => {
    return {
      id: faker.datatype.uuid(),
      initiationType: InitiationType.KEY,
      paymentPriorityType: PaymentPriorityType.PRIORITY,
      paymentPriorityLevelType: PaymentPriorityLevelType.PRIORITY_PAYMENT,
      finalityType: faker.datatype.number({ min: 0, max: 2 }),
      thirdPartIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      thirdPartPersonType: PersonType.LEGAL_PERSON,
      thirdPartDocument: cpf.generate(),
      thirdPartName: faker.name.fullName(),
      thirdPartAccountType: AccountType.CACC,
      thirdPartAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      clientIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      clientPersonType: PersonType.LEGAL_PERSON,
      clientDocument: cpf.generate(),
      clientAccountType: AccountType.CACC,
      clientAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      createdAt: faker.date.past(),
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      state: NotifyCreditValidationState.READY,
      response: {
        resultType: ResultType.VALID,
        createdAt: faker.date.recent(),
      },
    };
  },
  {
    afterBuild: (model) => {
      return new NotifyCreditValidationEntity(model);
    },
  },
);

export const NotifyCreditValidationFactory = factory;
