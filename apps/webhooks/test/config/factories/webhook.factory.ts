// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { WebhookEntity, WebhookType, WebhookState } from '@zro/webhooks/domain';
import { WebhookModel } from '@zro/webhooks/infrastructure';

/**
 * Webhook factory.
 */
factory.define<WebhookModel>(WebhookModel.name, WebhookModel, () => {
  return {
    id: faker.datatype.uuid(),
    type: WebhookType.DEPOSIT_RECEIVED,
    targetUrl: faker.internet.url(),
    accountNumber: faker.finance.account(),
    agencyNumber: faker.datatype.number(9999).toString(),
    userId: faker.datatype.uuid(),
    apiKey: faker.lorem.slug(),
    state: WebhookState.ACTIVE,
  };
});

/**
 * Webhook entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, WebhookEntity.name);

factory.define<WebhookEntity>(
  WebhookEntity.name,
  DefaultModel,
  async () => {
    return {
      id: faker.datatype.uuid(),
      accountNumber: faker.finance.account(),
      agencyNumber: faker.datatype.number(9999).toString(),
      userId: faker.datatype.uuid(),
      targetUrl: faker.datatype.string(32),
      apiKey: faker.datatype.string(32),
      type: WebhookType.DEPOSIT_RECEIVED,
      state: WebhookState.ACTIVE,
    };
  },
  {
    afterBuild: (model) => {
      return new WebhookEntity(model);
    },
  },
);

export const WebhookFactory = factory;
