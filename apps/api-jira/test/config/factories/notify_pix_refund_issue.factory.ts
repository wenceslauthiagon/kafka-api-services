// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import {
  NotifyEventType,
  NotifyPixRefundIssueEntity,
  NotifyStateType,
} from '@zro/api-jira/domain';
import { PixRefundReason, PixRefundStatus } from '@zro/pix-payments/domain';
import { NotifyPixRefundIssueModel } from '@zro/api-jira/infrastructure';

/**
 * Notify pix refund factory.
 */
factory.define<NotifyPixRefundIssueModel>(
  NotifyPixRefundIssueModel.name,
  NotifyPixRefundIssueModel,
  () => {
    return {
      status: PixRefundStatus.RECEIVED,
      issueId: faker.datatype.number({ min: 1, max: 99999 }),
      reason: PixRefundReason.FRAUD,
      operationId: faker.datatype.uuid(),
      description: faker.datatype.string(10),
      state: NotifyStateType.READY,
      issueCreatedAt: faker.date.recent(),
      summary: faker.datatype.string(10),
      eventType: NotifyEventType.CREATED,
    };
  },
);

/**
 * Notify pix refund entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, NotifyPixRefundIssueEntity.name);

factory.define<NotifyPixRefundIssueEntity>(
  NotifyPixRefundIssueEntity.name,
  DefaultModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      status: PixRefundStatus.RECEIVED,
      issueId: faker.datatype.number({ min: 1, max: 99999 }),
      reason: PixRefundReason.FRAUD,
      operationId: faker.datatype.uuid(),
      description: faker.datatype.string(10),
      state: NotifyStateType.READY,
      issueCreatedAt: faker.date.recent(),
      summary: faker.datatype.string(10),
      eventType: NotifyEventType.CREATED,
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
    };
  },
  {
    afterBuild: (model) => {
      return new NotifyPixRefundIssueEntity(model);
    },
  },
);

export const NotifyPixRefundIssueFactory = factory;
