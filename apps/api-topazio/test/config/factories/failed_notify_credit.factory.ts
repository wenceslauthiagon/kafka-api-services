// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel, FailedEntity } from '@zro/common';
import { FailedNotifyCreditEntity } from '@zro/api-topazio/domain';
import { FailedNotifyCreditModel } from '@zro/api-topazio/infrastructure';

/**
 * FailedNotifyCredit factory.
 */
factory.define<FailedNotifyCreditModel>(
  FailedNotifyCreditModel.name,
  FailedNotifyCreditModel,
  () => {
    return {
      transactionId: faker.datatype.uuid(),
      failedCode: 'PIX_DEPOSIT_RECEIVED_ACCOUNT_NOT_FOUND',
      failedMessage: 'Deposit sent to an inexistent or deactivated account.',
    };
  },
);

/**
 * FailedNotifyCredit entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, FailedNotifyCreditEntity.name);

factory.define<FailedNotifyCreditEntity>(
  FailedNotifyCreditEntity.name,
  DefaultModel,
  async () => {
    return {
      id: faker.datatype.uuid(),
      transactionId: faker.datatype.uuid(),
      failed: new FailedEntity({
        code: 'PIX_DEPOSIT_RECEIVED_ACCOUNT_NOT_FOUND',
        message: 'Deposit sent to an inexistent or deactivated account.',
      }),
    };
  },
  {
    afterBuild: (model) => {
      return new FailedNotifyCreditEntity(model);
    },
  },
);

export const FailedNotifyCreditFactory = factory;
