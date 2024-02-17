import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import { WebhookEvent, WebhookEventRepository } from '@zro/webhooks/domain';
import { WebhookEventModel } from '@zro/webhooks/infrastructure';

export class WebhookEventDatabaseRepository
  extends DatabaseRepository
  implements WebhookEventRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(webhookEventModel: WebhookEventModel): WebhookEvent {
    return webhookEventModel?.toDomain() ?? null;
  }

  async create(webhookEvent: WebhookEvent): Promise<WebhookEvent> {
    const createdWebhookEvent =
      await WebhookEventModel.create<WebhookEventModel>(webhookEvent, {
        transaction: this.transaction,
      });

    return createdWebhookEvent;
  }

  async getById(id: string): Promise<WebhookEvent> {
    return WebhookEventModel.findOne<WebhookEventModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(WebhookEventDatabaseRepository.toDomain);
  }

  async update(webhookEvent: WebhookEvent): Promise<WebhookEvent> {
    await WebhookEventModel.update<WebhookEventModel>(webhookEvent, {
      where: { id: webhookEvent.id },
      transaction: this.transaction,
    });

    return webhookEvent;
  }
}
