// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { ConfigService } from '@nestjs/config';
import { EncryptService, DefaultModel } from '@zro/common';
import {
  WebhookEventEntity,
  WebhookEventState,
  WebhookType,
} from '@zro/webhooks/domain';
import { WebhookEventModel } from '@zro/webhooks/infrastructure';

const encryter = new EncryptService(
  new ConfigService({
    APP_ENCRYPT_PASSWORD: '12345679912345678912345678912345',
  }),
);

/**
 * WebhookEvent factory.
 */
factory.define<WebhookEventModel>(
  WebhookEventModel.name,
  WebhookEventModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      state: WebhookEventState.PENDING,
      targetUrl: encryter.encrypt(faker.internet.url()),
      apiKey: encryter.encrypt(faker.datatype.string(32)),
      type: WebhookType.DEPOSIT_RECEIVED,
      webhookId: faker.datatype.uuid(),
      agencyNumber: faker.datatype.number(9999).toString().padStart(4, '0'),
      accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
      httpStatusCodeResponse: faker.datatype
        .number({ min: 1, max: 9999 })
        .toString(),
      data: {
        [faker.datatype.string()]: faker.datatype.string(),
        [faker.datatype.string()]: faker.datatype.string(),
        [faker.datatype.string()]: faker.datatype.string(),
      },
      retryLimit: faker.datatype.datetime(),
    };
  },
);

/**
 * WebhookEvent entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, WebhookEventEntity.name);

factory.define<WebhookEventEntity>(
  WebhookEventEntity.name,
  DefaultModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      state: WebhookEventState.PENDING,
      targetUrl: encryter.encrypt(faker.internet.url()),
      apiKey: encryter.encrypt(faker.datatype.string(32)),
      type: WebhookType.DEPOSIT_RECEIVED,
      webhookId: faker.datatype.uuid(),
      agencyNumber: faker.datatype.number(9999).toString().padStart(4, '0'),
      accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
      httpStatusCodeResponse: faker.datatype
        .number({ min: 200, max: 600 })
        .toString(),
      data: {
        [faker.datatype.string()]: faker.datatype.string(),
        [faker.datatype.string()]: faker.datatype.string(),
        [faker.datatype.string()]: faker.datatype.string(),
      },
      retryLimit: faker.datatype.datetime(),
    };
  },
  {
    afterBuild: (model) => {
      return new WebhookEventEntity(model);
    },
  },
);

export const WebhookEventFactory = factory;
