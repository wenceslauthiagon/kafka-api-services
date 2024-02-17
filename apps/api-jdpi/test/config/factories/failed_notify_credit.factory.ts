// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import {
  FailedNotifyCreditEntity,
  NotifyCreditTransactionType,
} from '@zro/api-jdpi/domain';
import { FailedNotifyCreditModel } from '@zro/api-jdpi/infrastructure';

/**
 * FailedNotifyCredit factory.
 */
factory.define<FailedNotifyCreditModel>(
  FailedNotifyCreditModel.name,
  FailedNotifyCreditModel,
  () => {
    return {
      externalId: faker.datatype.uuid(),
      failedTransactionType: NotifyCreditTransactionType.CREDIT_DEPOSIT,
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
      externalId: faker.datatype.uuid(),
      failedTransactionType: NotifyCreditTransactionType.CREDIT_DEPOSIT,
    };
  },
  {
    afterBuild: (model) => {
      return new FailedNotifyCreditEntity(model);
    },
  },
);

export const FailedNotifyCreditFactory = factory;
