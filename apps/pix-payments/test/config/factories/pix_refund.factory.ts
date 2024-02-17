// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import {
  PixRefundReason,
  PixRefundEntity,
  PixRefundState,
  PixRefundStatus,
  PixInfractionEntity,
  PixRefundTransactionType,
  PixDepositEntity,
  PixRefundRejectionReason,
} from '@zro/pix-payments/domain';
import { BankEntity } from '@zro/banking/domain';
import { OperationEntity } from '@zro/operations/domain';
import {
  PixDepositModel,
  PixRefundModel,
} from '@zro/pix-payments/infrastructure';

/**
 * PixRefund model factory.
 */
factory.define<PixRefundModel>(PixRefundModel.name, PixRefundModel, () => {
  return {
    id: faker.datatype.uuid(),
    solicitationPspId: faker.datatype.uuid(),
    issueId: faker.datatype.number({ min: 1, max: 9999 }),
    endToEndId: faker.datatype.number(99999).toString(),
    contested: faker.datatype.boolean(),
    amount: faker.datatype.number({ min: 1, max: 9999 }),
    description: faker.lorem.words(20),
    reason: PixRefundReason.FRAUD,
    requesterBank: new BankEntity({ ispb: '11111111' }),
    responderBank: new BankEntity({ ispb: '11111111' }),
    status: PixRefundStatus.OPEN,
    state: PixRefundState.RECEIVE_PENDING,
    analysisResult: faker.lorem.words(20),
    analysisDetails: faker.lorem.words(20),
    rejectionReason: PixRefundRejectionReason.ACCOUNT_CLOSURE,
    transactionId: factory.assoc(PixDepositModel.name, 'id'),
    operation: new OperationEntity({ id: faker.datatype.uuid() }),
    transactionType: PixRefundTransactionType.DEPOSIT,
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  };
});

/**
 * PixRefund entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, PixRefundEntity.name);

factory.define<PixRefundEntity>(
  PixRefundEntity.name,
  DefaultModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      solicitationPspId: faker.datatype.uuid(),
      issueId: faker.datatype.number({ min: 1, max: 9999 }),
      contested: faker.datatype.boolean(),
      amount: faker.datatype.number({ min: 1, max: 9999 }),
      description: faker.lorem.words(20),
      reason: PixRefundReason.FRAUD,
      requesterBank: new BankEntity({ ispb: '11111111' }),
      responderBank: new BankEntity({ ispb: '11111111' }),
      status: PixRefundStatus.OPEN,
      state: PixRefundState.RECEIVE_PENDING,
      analysisResult: faker.lorem.words(20),
      analysisDetails: faker.lorem.words(20),
      rejectionReason: PixRefundRejectionReason.ACCOUNT_CLOSURE,
      transaction: new PixDepositEntity({
        id: faker.datatype.uuid(),
        endToEndId: faker.datatype.uuid(),
      }),
      infraction: new PixInfractionEntity({ id: faker.datatype.uuid() }),
      operation: new OperationEntity({ id: faker.datatype.uuid() }),
      transactionType: PixRefundTransactionType.DEPOSIT,
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
    };
  },
  {
    afterBuild: (model) => {
      return new PixRefundEntity(model);
    },
  },
);

export const PixRefundFactory = factory;
