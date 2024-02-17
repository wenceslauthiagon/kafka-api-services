// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import {
  NotifyRegisterBankingTedEntity,
  NotifyRegisterBankingTedStatus,
  NotifyStateType,
} from '@zro/api-topazio/domain';
import { NotifyRegisterBankingTedModel } from '@zro/api-topazio/infrastructure';

/**
 * NotifyRegisterBankingTed factory.
 */
factory.define<NotifyRegisterBankingTedModel>(
  NotifyRegisterBankingTedModel.name,
  NotifyRegisterBankingTedModel,
  () => {
    return {
      transactionId: faker.datatype.uuid(),
      status: NotifyRegisterBankingTedStatus.TED_FORWARDED,
      state: NotifyStateType.READY,
    };
  },
);

/**
 * NotifyRegisterBankingTed entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, NotifyRegisterBankingTedEntity.name);

factory.define<NotifyRegisterBankingTedEntity>(
  NotifyRegisterBankingTedEntity.name,
  DefaultModel,
  async () => {
    return {
      transactionId: faker.datatype.uuid(),
      status: NotifyRegisterBankingTedStatus.TED_FORWARDED,
      state: NotifyStateType.READY,
    };
  },
  {
    afterBuild: (model) => {
      return new NotifyRegisterBankingTedEntity(model);
    },
  },
);

export const NotifyRegisterBankingTedFactory = factory;
