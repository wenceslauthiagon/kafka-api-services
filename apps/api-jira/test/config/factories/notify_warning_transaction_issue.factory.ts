// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { v4 as uuidV4 } from 'uuid';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import {
  NotifyWarningTransactionIssueEntity,
  NotifyStateType,
  NotifyEventType,
} from '@zro/api-jira/domain';
import { WarningTransactionStatus } from '@zro/compliance/domain';
import { NotifyWarningTransactionIssueModel } from '@zro/api-jira/infrastructure';

/**
 * Notify Issue factory.
 */
factory.define<NotifyWarningTransactionIssueModel>(
  NotifyWarningTransactionIssueModel.name,
  NotifyWarningTransactionIssueModel,
  () => {
    return {
      status: WarningTransactionStatus.PENDING,
      issueId: faker.datatype.number({ min: 1, max: 99999 }),
      operationId: faker.datatype.uuid(),
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
factory.setAdapter(objectAdapter, NotifyWarningTransactionIssueEntity.name);

factory.define<NotifyWarningTransactionIssueEntity>(
  NotifyWarningTransactionIssueEntity.name,
  DefaultModel,
  () => {
    return {
      id: uuidV4(),
      status: WarningTransactionStatus.PENDING,
      issueId: faker.datatype.number({ min: 1, max: 99999 }),
      operationId: faker.datatype.uuid(),
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
      return new NotifyWarningTransactionIssueEntity(model);
    },
  },
);

export const NotifyWarningTransactionIssueFactory = factory;
