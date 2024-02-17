// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf, cnpj } from 'cpf-cnpj-validator';
import { DefaultModel } from '@zro/common/test';
import {
  DecodedPixAccountEntity,
  DecodedQrCodeEntity,
  PaymentEntity,
  PaymentState,
  PaymentType,
  AccountType,
  PaymentPriorityType,
} from '@zro/pix-payments/domain';
import { DecodedPixKeyEntity } from '@zro/pix-keys/domain';
import { UserEntity, PersonType } from '@zro/users/domain';
import { OperationEntity, WalletEntity } from '@zro/operations/domain';
import { PaymentModel } from '@zro/pix-payments/infrastructure';

/**
 * Payment model factory.
 */
factory.define<PaymentModel>(PaymentModel.name, PaymentModel, () => {
  return {
    id: faker.datatype.uuid(),
    beneficiaryAccountType: AccountType.CACC,
    beneficiaryPersonType: PersonType.NATURAL_PERSON,
    state: PaymentState.PENDING,
    priorityType: PaymentPriorityType.PRIORITY,
    beneficiaryBranch: faker.datatype
      .number({ min: 1, max: 9999 })
      .toString()
      .padStart(4, '0'),
    beneficiaryAccountNumber: faker.datatype
      .number({ min: 1, max: 99999 })
      .toString()
      .padStart(8, '0'),
    beneficiaryBankName: faker.company.name(),
    beneficiaryBankIspb: faker.datatype
      .number({ min: 1, max: 99999 })
      .toString()
      .padStart(8, '0'),
    beneficiaryDocument: cpf.generate(),
    beneficiaryName: faker.name.firstName(),
    value: faker.datatype.number({ min: 1, max: 99999 }),
    endToEndId: faker.datatype.uuid(),
    paymentDate: null,
    description: null,
    ownerAccountNumber: faker.datatype
      .number({ min: 1, max: 99999 })
      .toString()
      .padStart(8, '0'),
    ownerBranch: faker.datatype
      .number({ min: 1, max: 9999 })
      .toString()
      .padStart(4, '0'),
    ownerDocument: cnpj.generate(),
    ownerFullName: faker.name.firstName(),
    ownerPersonType: PersonType.LEGAL_PERSON,
    userId: faker.datatype.uuid(),
    walletId: faker.datatype.uuid(),
    operation: new OperationEntity({ id: faker.datatype.uuid() }),
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
    transactionTag: faker.datatype.string(),
    paymentType: PaymentType.ACCOUNT,
  };
});

/**
 * Payment entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, PaymentEntity.name);

factory.define<PaymentEntity>(
  PaymentEntity.name,
  DefaultModel,
  async () => {
    return {
      id: faker.datatype.uuid(),
      beneficiaryAccountType: AccountType.CACC,
      beneficiaryPersonType: PersonType.NATURAL_PERSON,
      state: PaymentState.PENDING,
      priorityType: PaymentPriorityType.PRIORITY,
      beneficiaryBranch: faker.datatype
        .number({ min: 1, max: 9999 })
        .toString()
        .padStart(4, '0'),
      beneficiaryAccountNumber: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      beneficiaryBankName: faker.company.name(),
      beneficiaryBankIspb: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      beneficiaryDocument: cpf.generate(),
      beneficiaryName: faker.name.firstName(),
      value: faker.datatype.number({ min: 1, max: 99999 }),
      endToEndId: faker.datatype.uuid(),
      paymentDate: null,
      description: null,
      ownerAccountNumber: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      ownerBranch: faker.datatype
        .number({ min: 1, max: 9999 })
        .toString()
        .padStart(4, '0'),
      ownerDocument: cnpj.generate(),
      ownerFullName: faker.name.firstName(),
      ownerPersonType: PersonType.LEGAL_PERSON,
      user: new UserEntity({ uuid: faker.datatype.uuid() }),
      wallet: new WalletEntity({ uuid: faker.datatype.uuid() }),
      operation: new OperationEntity({ id: faker.datatype.uuid() }),
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
      transactionTag: faker.datatype.string(),
      paymentType: PaymentType.ACCOUNT,
      decodedQrCode: new DecodedQrCodeEntity({ id: faker.datatype.uuid() }),
      decodedPixKey: new DecodedPixKeyEntity({ id: faker.datatype.uuid() }),
      decodedPixAccount: new DecodedPixAccountEntity({
        id: faker.datatype.uuid(),
      }),
    };
  },
  {
    afterBuild: (model) => {
      return new PaymentEntity(model);
    },
  },
);

export const PaymentFactory = factory;
