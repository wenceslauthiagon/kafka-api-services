// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import {
  NotifyUserLimitRequestIssueEntity,
  UserLimitRequestNotifyStateType,
  UserLimitRequestNotifyEventType,
} from '@zro/api-jira/domain';
import { UserLimitRequestStatus } from '@zro/compliance/domain';
import { NotifyUserLimitRequestIssueModel } from '@zro/api-jira/infrastructure';

/**
 * Notify user limit factory.
 */
factory.define<NotifyUserLimitRequestIssueModel>(
  NotifyUserLimitRequestIssueModel.name,
  NotifyUserLimitRequestIssueModel,
  () => {
    return {
      status: UserLimitRequestStatus.OPEN,
      issueId: faker.datatype.number({ min: 1, max: 99999 }),
      userLimitRequestId: faker.datatype.uuid(),
      state: UserLimitRequestNotifyStateType.READY,
      issueCreatedAt: faker.date.recent(),
      summary: faker.datatype.string(10),
      eventType: UserLimitRequestNotifyEventType.CREATED,
    };
  },
);

/**
 * Notify user limit entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, NotifyUserLimitRequestIssueEntity.name);

factory.define<NotifyUserLimitRequestIssueEntity>(
  NotifyUserLimitRequestIssueEntity.name,
  DefaultModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      status: UserLimitRequestStatus.OPEN,
      issueId: faker.datatype.number({ min: 1, max: 99999 }),
      userLimitRequestId: faker.datatype.uuid(),
      state: UserLimitRequestNotifyStateType.READY,
      issueCreatedAt: faker.date.recent(),
      summary: faker.datatype.string(10),
      eventType: UserLimitRequestNotifyEventType.CREATED,
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
    };
  },
  {
    afterBuild: (model) => {
      return new NotifyUserLimitRequestIssueEntity(model);
    },
  },
);

export const NotifyUserLimitRequestIssueFactory = factory;
