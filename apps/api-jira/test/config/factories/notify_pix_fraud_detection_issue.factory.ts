// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf } from 'cpf-cnpj-validator';
import { DefaultModel } from '@zro/common';
import {
  NotifyEventType,
  NotifyPixFraudDetectionIssueEntity,
  NotifyStateType,
} from '@zro/api-jira/domain';
import {
  PixFraudDetectionStatus,
  PixFraudDetectionType,
} from '@zro/pix-payments/domain';
import { NotifyPixFraudDetectionIssueModel } from '@zro/api-jira/infrastructure';

/**
 * Notify pix fraud detection factory.
 */
factory.define<NotifyPixFraudDetectionIssueModel>(
  NotifyPixFraudDetectionIssueModel.name,
  NotifyPixFraudDetectionIssueModel,
  () => {
    return {
      status: PixFraudDetectionStatus.REGISTERED,
      issueId: faker.datatype.number({ min: 1, max: 99999 }),
      fraudType: PixFraudDetectionType.FALSE_IDENTIFICATION,
      key: faker.datatype.uuid(),
      document: cpf.generate(),
      state: NotifyStateType.READY,
      issueCreatedAt: faker.date.recent(),
      summary: faker.datatype.string(10),
      eventType: NotifyEventType.CREATED,
    };
  },
);

/**
 * Notify pix fraud detection entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, NotifyPixFraudDetectionIssueEntity.name);

factory.define<NotifyPixFraudDetectionIssueEntity>(
  NotifyPixFraudDetectionIssueEntity.name,
  DefaultModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      status: PixFraudDetectionStatus.REGISTERED,
      issueId: faker.datatype.number({ min: 1, max: 99999 }),
      fraudType: PixFraudDetectionType.FALSE_IDENTIFICATION,
      key: faker.datatype.uuid(),
      document: cpf.generate(),
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
      return new NotifyPixFraudDetectionIssueEntity(model);
    },
  },
);

export const NotifyPixFraudDetectionIssueFactory = factory;
