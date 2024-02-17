import { Test, TestingModule } from '@nestjs/testing';

import { WebhookModel } from '@zro/webhooks/infrastructure';
import { AppModule } from '@zro/webhooks/infrastructure/nest/modules/app.module';
import { WebhookFactory } from '@zro/test/webhooks/config';

describe('WebhookModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const webhook = await WebhookFactory.create<WebhookModel>(
      WebhookModel.name,
    );

    expect(webhook).toBeDefined();
    expect(webhook.id).toBeDefined();
    expect(webhook.targetUrl).toBeDefined();
    expect(webhook.agencyNumber).toBeDefined();
    expect(webhook.accountNumber).toBeDefined();
    expect(webhook.userId).toBeDefined();
    expect(webhook.apiKey).toBeDefined();
    expect(webhook.type).toBeDefined();
    expect(webhook.state).toBeDefined();
    expect(webhook.createdAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
