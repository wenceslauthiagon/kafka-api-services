import { Test, TestingModule } from '@nestjs/testing';

import { WebhookEventModel } from '@zro/webhooks/infrastructure';
import { AppModule } from '@zro/webhooks/infrastructure/nest/modules/app.module';
import { WebhookEventFactory } from '@zro/test/webhooks/config';

describe('WebhookEventModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const webhookEvent = await WebhookEventFactory.create<WebhookEventModel>(
      WebhookEventModel.name,
    );

    expect(webhookEvent).toBeDefined();
    expect(webhookEvent.id).toBeDefined();
    expect(webhookEvent.state).toBeDefined();
    expect(webhookEvent.targetUrl).toBeDefined();
    expect(webhookEvent.apiKey).toBeDefined();
    expect(webhookEvent.agencyNumber).toBeDefined();
    expect(webhookEvent.accountNumber).toBeDefined();
    expect(webhookEvent.type).toBeDefined();
    expect(webhookEvent.httpStatusCodeResponse).toBeDefined();
    expect(webhookEvent.data).toBeDefined();
    expect(webhookEvent.retryLimit).toBeDefined();
    expect(webhookEvent.createdAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
