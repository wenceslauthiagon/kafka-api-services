// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf } from 'cpf-cnpj-validator';
import { DefaultModel } from '@zro/common/test';
import { UserEntity, PersonDocumentType } from '@zro/users/domain';
import { BankEntity } from '@zro/banking/domain';
import { OperationEntity, WalletEntity } from '@zro/operations/domain';
import {
  AccountType,
  PaymentEntity,
  PixDevolutionReceivedEntity,
  PixDevolutionReceivedState,
} from '@zro/pix-payments/domain';
import { PixDevolutionReceivedModel } from '@zro/pix-payments/infrastructure';

/**
 * PixDevolutionReceived factory.
 */
factory.define<PixDevolutionReceivedModel>(
  PixDevolutionReceivedModel.name,
  PixDevolutionReceivedModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      userId: faker.datatype.uuid(),
      walletId: faker.datatype.uuid(),
      operationId: faker.datatype.uuid(),
      description: faker.datatype.string(),
      txId: faker.datatype.uuid(),
      transactionOriginalId: faker.datatype.uuid(),
      endToEndId: faker.datatype.uuid(),
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      clientBankIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      clientBankName: faker.datatype.string(),
      clientBranch: faker.datatype.number(9999).toString().padStart(4, '0'),
      clientAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      clientPersonType: PersonDocumentType.CPF,
      clientDocument: cpf.generate(),
      clientName: faker.datatype.string(),
      clientKey: faker.datatype.uuid(),
      thirdPartBankIspb: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      thirdPartBankName: faker.datatype.string(),
      thirdPartBranch: faker.datatype.number(9999).toString().padStart(4, '0'),
      thirdPartAccountType: AccountType.CACC,
      thirdPartAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      thirdPartPersonType: PersonDocumentType.CPF,
      thirdPartDocument: cpf.generate(),
      thirdPartName: faker.datatype.string(),
      thirdPartKey: faker.datatype.string(),
      transactionTag: faker.datatype.string(),
      state: PixDevolutionReceivedState.READY,
      createdAt: faker.date.recent(99),
    };
  },
);

/**
 * PixDevolutionReceived entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, PixDevolutionReceivedEntity.name);

factory.define<PixDevolutionReceivedEntity>(
  PixDevolutionReceivedEntity.name,
  DefaultModel,
  async () => {
    return {
      id: faker.datatype.uuid(),
      user: new UserEntity({ uuid: faker.datatype.uuid() }),
      wallet: new WalletEntity({ uuid: faker.datatype.uuid() }),
      operation: new OperationEntity({ id: faker.datatype.uuid() }),
      description: faker.datatype.string(),
      txId: faker.datatype.uuid(),
      payment: new PaymentEntity({ id: faker.datatype.uuid() }),
      endToEndId: faker.datatype.uuid(),
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      clientBank: new BankEntity({
        ispb: faker.datatype.number(99999).toString().padStart(8, '0'),
        name: faker.datatype.string(),
      }),
      clientBranch: faker.datatype.number(9999).toString().padStart(4, '0'),
      clientAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      clientPersonType: PersonDocumentType.CPF,
      clientDocument: cpf.generate(),
      clientName: faker.datatype.string(),
      clientKey: faker.datatype.uuid(),
      thirdPartBank: new BankEntity({
        ispb: faker.datatype.number(99999).toString().padStart(8, '0'),
        name: faker.datatype.string(),
      }),
      thirdPartBranch: faker.datatype.number(9999).toString().padStart(4, '0'),
      thirdPartAccountType: AccountType.CACC,
      thirdPartAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      thirdPartPersonType: PersonDocumentType.CPF,
      thirdPartDocument: cpf.generate(),
      thirdPartName: faker.datatype.string(),
      thirdPartKey: faker.datatype.string(),
      transactionTag: faker.datatype.string(),
    };
  },
  {
    afterBuild: (model) => {
      return new PixDevolutionReceivedEntity(model);
    },
  },
);

export const PixDevolutionReceivedFactory = factory;
