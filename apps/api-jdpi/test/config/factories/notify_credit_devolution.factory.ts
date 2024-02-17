// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf } from 'cpf-cnpj-validator';
import { DefaultModel } from '@zro/common/test';
import {
  NotifyCreditDevolutionEntity,
  NotifyStateType,
} from '@zro/api-jdpi/domain';
import { PersonType } from '@zro/users/domain';
import { AccountType } from '@zro/pix-payments/domain';
import { NotifyCreditDevolutionModel } from '@zro/api-jdpi/infrastructure';

/**
 * NotifyCreditDeposit factory.
 */
factory.define<NotifyCreditDevolutionModel>(
  NotifyCreditDevolutionModel.name,
  NotifyCreditDevolutionModel,
  () => {
    return {
      externalId: faker.datatype.uuid(),
      originalEndToEndId: faker.datatype.string(),
      devolutionEndToEndId: faker.datatype.string(),
      devolutionCode: faker.datatype.string(4).toLocaleUpperCase(),
      thirdPartIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      thirdPartPersonType: PersonType.LEGAL_PERSON,
      thirdPartDocument: cpf.generate(),
      thirdPartAccountType: AccountType.CACC,
      thirdPartAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      thirdPartName: faker.name.fullName(),
      clientIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      clientPersonType: PersonType.LEGAL_PERSON,
      clientDocument: cpf.generate(),
      clientAccountType: AccountType.CACC,
      clientAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      state: NotifyStateType.READY,
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      createdAt: new Date(),
    };
  },
);

/**
 * NotifyCreditDeposit entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, NotifyCreditDevolutionEntity.name);

factory.define<NotifyCreditDevolutionEntity>(
  NotifyCreditDevolutionEntity.name,
  DefaultModel,
  async () => {
    return {
      externalId: faker.datatype.uuid(),
      originalEndToEndId: faker.datatype.string(),
      devolutionEndToEndId: faker.datatype.string(),
      devolutionCode: faker.datatype.string(4).toLocaleUpperCase(),
      thirdPartIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      thirdPartPersonType: PersonType.LEGAL_PERSON,
      thirdPartDocument: cpf.generate(),
      thirdPartAccountType: AccountType.CACC,
      thirdPartAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      thirdPartName: faker.name.fullName(),
      clientIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      clientPersonType: PersonType.LEGAL_PERSON,
      clientDocument: cpf.generate(),
      clientAccountType: AccountType.CACC,
      clientAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      createdAt: new Date(),
    };
  },
  {
    afterBuild: (model) => {
      return new NotifyCreditDevolutionEntity(model);
    },
  },
);

export const NotifyCreditDevolutionFactory = factory;
