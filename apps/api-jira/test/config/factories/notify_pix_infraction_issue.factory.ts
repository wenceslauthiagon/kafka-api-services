// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import {
  NotifyEventType,
  NotifyPixInfractionIssueEntity,
  NotifyStateType,
} from '@zro/api-jira/domain';
import {
  PixInfractionStatus,
  PixInfractionType,
} from '@zro/pix-payments/domain';
import { NotifyPixInfractionIssueModel } from '@zro/api-jira/infrastructure';

/**
 * Notify pix infraction factory.
 */
factory.define<NotifyPixInfractionIssueModel>(
  NotifyPixInfractionIssueModel.name,
  NotifyPixInfractionIssueModel,
  () => {
    return {
      status: PixInfractionStatus.NEW,
      issueId: faker.datatype.number({ min: 1, max: 99999 }),
      infractionType: PixInfractionType.FRAUD,
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
 * Notify pix infraction entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, NotifyPixInfractionIssueEntity.name);

factory.define<NotifyPixInfractionIssueEntity>(
  NotifyPixInfractionIssueEntity.name,
  DefaultModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      status: PixInfractionStatus.NEW,
      issueId: faker.datatype.number({ min: 1, max: 99999 }),
      infractionType: PixInfractionType.FRAUD,
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
      return new NotifyPixInfractionIssueEntity(model);
    },
  },
);

export const NotifyPixInfractionIssueFactory = factory;
