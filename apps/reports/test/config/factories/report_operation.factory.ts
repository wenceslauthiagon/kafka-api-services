// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf } from 'cpf-cnpj-validator';
import { DefaultModel } from '@zro/common';
import { ReportOperationModel } from '@zro/reports/infrastructure';
import { OperationType, ReportOperationEntity } from '@zro/reports/domain';
import { PersonType, UserEntity } from '@zro/users/domain';
import {
  CurrencyEntity,
  OperationEntity,
  TransactionTypeEntity,
} from '@zro/operations/domain';

/**
 * ReportOperation model factory.
 */
factory.define<ReportOperationModel>(
  ReportOperationModel.name,
  ReportOperationModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      operationId: faker.datatype.uuid(),
      operationDate: new Date(),
      operationValue: faker.datatype.number({ min: 1, max: 9999 }),
      operationType: OperationType.C,
      transactionTypeId: faker.datatype.number({ min: 1, max: 9999 }),
      transactionTypeTitle: faker.lorem.words(20),
      transactionTypeTag: faker.random.alpha({ count: 5, casing: 'upper' }),
      thirdPartName: faker.name.firstName(),
      thirdPartDocument: cpf.generate(),
      thirdPartDocumentType: PersonType.NATURAL_PERSON,
      thirdPartBankCode: faker.datatype
        .number({ min: 1, max: 999 })
        .toString()
        .padStart(3, '0'),
      thirdPartBranch: faker.datatype
        .number({ min: 1, max: 9999 })
        .toString()
        .padStart(4, '0'),
      thirdPartAccountNumber: faker.datatype
        .number({ min: 1, max: 999999 })
        .toString(),
      clientId: faker.datatype.uuid(),
      clientName: faker.name.firstName(),
      clientDocument: cpf.generate(),
      owneDocumentType: PersonType.NATURAL_PERSON,
      clientBankCode: faker.datatype
        .number({ min: 1, max: 999 })
        .toString()
        .padStart(3, '0'),
      clientBranch: faker.datatype
        .number({ min: 1, max: 9999 })
        .toString()
        .padStart(4, '0'),
      clientAccountNumber: faker.datatype
        .number({ min: 1, max: 999999 })
        .toString(),
      currencySymbol: faker.lorem.words(3),
    };
  },
);

/**
 * ReportOperation entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, ReportOperationEntity.name);

factory.define<ReportOperationEntity>(
  ReportOperationEntity.name,
  DefaultModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      operation: new OperationEntity({
        id: faker.datatype.uuid(),
        createdAt: new Date(),
        value: faker.datatype.number({ min: 1, max: 9999 }),
      }),
      operationType: OperationType.C,
      transactionType: new TransactionTypeEntity({
        id: faker.datatype.number({ min: 1, max: 9999 }),
        title: faker.lorem.words(20),
        tag: faker.random.alpha({ count: 5, casing: 'upper' }),
      }),
      thirdPart: new UserEntity({
        name: faker.name.firstName(),
        document: cpf.generate(),
        type: PersonType.NATURAL_PERSON,
      }),
      thirdPartBankCode: faker.datatype
        .number({ min: 1, max: 999 })
        .toString()
        .padStart(3, '0'),
      thirdPartBranch: faker.datatype
        .number({ min: 1, max: 9999 })
        .toString()
        .padStart(4, '0'),
      thirdPartAccountNumber: faker.datatype
        .number({ min: 1, max: 999999 })
        .toString(),
      client: new UserEntity({
        uuid: faker.datatype.uuid(),
        name: faker.name.firstName(),
        document: cpf.generate(),
        type: PersonType.NATURAL_PERSON,
      }),
      clientBankCode: faker.datatype
        .number({ min: 1, max: 999 })
        .toString()
        .padStart(3, '0'),
      clientBranch: faker.datatype
        .number({ min: 1, max: 9999 })
        .toString()
        .padStart(4, '0'),
      clientAccountNumber: faker.datatype
        .number({ min: 1, max: 999999 })
        .toString(),
      currency: new CurrencyEntity({
        symbol: faker.lorem.words(3),
      }),
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
    };
  },
  {
    afterBuild: (model) => {
      return new ReportOperationEntity(model);
    },
  },
);

export const ReportOperationFactory = factory;
