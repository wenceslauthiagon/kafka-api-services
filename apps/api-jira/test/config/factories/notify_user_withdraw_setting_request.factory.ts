// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { v4 as uuidV4 } from 'uuid';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import {
  NotifyUserWithdrawSettingRequestIssueEntity,
  NotifyStateType,
  NotifyEventType,
} from '@zro/api-jira/domain';
import { UserWithdrawSettingRequestState } from '@zro/compliance/domain';
import { NotifyUserWithdrawSettingRequestIssueModel } from '@zro/api-jira/infrastructure';

/**
 * Notify Issue factory.
 */
factory.define<NotifyUserWithdrawSettingRequestIssueModel>(
  NotifyUserWithdrawSettingRequestIssueModel.name,
  NotifyUserWithdrawSettingRequestIssueModel,
  () => {
    return {
      status: UserWithdrawSettingRequestState.PENDING,
      issueId: faker.datatype.number({ min: 1, max: 99999 }).toString(),
      userWithdrawSettingRequestId: faker.datatype.uuid(),
      state: NotifyStateType.READY,
      issueCreatedAt: new Date(),
      summary: faker.datatype.string(10),
      eventType: NotifyEventType.CREATED,
    };
  },
);

/**
 * Infraction entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(
  objectAdapter,
  NotifyUserWithdrawSettingRequestIssueEntity.name,
);

factory.define<NotifyUserWithdrawSettingRequestIssueEntity>(
  NotifyUserWithdrawSettingRequestIssueEntity.name,
  DefaultModel,
  () => {
    return {
      id: uuidV4(),
      status: UserWithdrawSettingRequestState.PENDING,
      issueId: faker.datatype.number({ min: 1, max: 99999 }).toString(),
      userWithdrawSettingRequestId: faker.datatype.uuid(),
      state: NotifyStateType.READY,
      issueCreatedAt: new Date(),
      summary: faker.datatype.string(10),
      eventType: NotifyEventType.CREATED,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },
  {
    afterBuild: (model) => {
      return new NotifyUserWithdrawSettingRequestIssueEntity(model);
    },
  },
);

export const NotifyUserWithdrawSettingRequestIssueFactory = factory;
