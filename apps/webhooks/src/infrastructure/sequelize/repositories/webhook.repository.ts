import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import {
  Webhook,
  WebhookRepository,
  WebhookState,
  WebhookType,
} from '@zro/webhooks/domain';
import { WebhookModel } from '@zro/webhooks/infrastructure';

export class WebhookDatabaseRepository
  extends DatabaseRepository
  implements WebhookRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(WebhookModel: WebhookModel): Webhook {
    return WebhookModel?.toDomain() ?? null;
  }

  async getActivateAndPaymentCompletedByAccountAndAgency(
    accountNumber: string,
    agencyNumber: string,
  ): Promise<Webhook> {
    return WebhookModel.findOne<WebhookModel>({
      where: {
        accountNumber,
        agencyNumber,
        state: WebhookState.ACTIVE,
        type: WebhookType.PAYMENT_COMPLETED,
      },
      transaction: this.transaction,
    }).then(WebhookDatabaseRepository.toDomain);
  }

  async getActivateAndDevolutionReceivedByAccountAndAgency(
    accountNumber: string,
    agencyNumber: string,
  ): Promise<Webhook> {
    return WebhookModel.findOne<WebhookModel>({
      where: {
        accountNumber,
        agencyNumber,
        state: WebhookState.ACTIVE,
        type: WebhookType.DEVOLUTION_RECEIVED,
      },
      transaction: this.transaction,
    }).then(WebhookDatabaseRepository.toDomain);
  }

  async getActivateAndDepositReceivedByAccountAndAgency(
    accountNumber: string,
    agencyNumber: string,
  ): Promise<Webhook> {
    return WebhookModel.findOne<WebhookModel>({
      where: {
        accountNumber,
        agencyNumber,
        state: WebhookState.ACTIVE,
        type: WebhookType.DEPOSIT_RECEIVED,
      },
      transaction: this.transaction,
    }).then(WebhookDatabaseRepository.toDomain);
  }

  async getActivateAndDevolutionCompletedByAccountAndAgency(
    accountNumber: string,
    agencyNumber: string,
  ): Promise<Webhook> {
    return WebhookModel.findOne<WebhookModel>({
      where: {
        accountNumber,
        agencyNumber,
        state: WebhookState.ACTIVE,
        type: WebhookType.DEVOLUTION_COMPLETED,
      },
      transaction: this.transaction,
    }).then(WebhookDatabaseRepository.toDomain);
  }

  async getById(id: string): Promise<Webhook> {
    return WebhookModel.findOne<WebhookModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(WebhookDatabaseRepository.toDomain);
  }

  async create(Webhook: Webhook): Promise<Webhook> {
    const QreatedWebhook = await WebhookModel.create<WebhookModel>(Webhook, {
      transaction: this.transaction,
    });

    Webhook.createdAt = QreatedWebhook.createdAt;

    return Webhook;
  }

  async update(Webhook: Webhook): Promise<Webhook> {
    await WebhookModel.update<WebhookModel>(Webhook, {
      where: { id: Webhook.id },
      transaction: this.transaction,
    });

    return Webhook;
  }

  async getActivateAndPaymentFailedByAccountAndAgency(
    accountNumber: string,
    agencyNumber: string,
  ): Promise<Webhook> {
    return WebhookModel.findOne<WebhookModel>({
      where: {
        accountNumber,
        agencyNumber,
        state: WebhookState.ACTIVE,
        type: WebhookType.PAYMENT_FAILED,
      },
      transaction: this.transaction,
    }).then(WebhookDatabaseRepository.toDomain);
  }

  async getActivateAndDevolutionFailedByAccountAndAgency(
    accountNumber: string,
    agencyNumber: string,
  ): Promise<Webhook> {
    return WebhookModel.findOne<WebhookModel>({
      where: {
        accountNumber,
        agencyNumber,
        state: WebhookState.ACTIVE,
        type: WebhookType.DEVOLUTION_FAILED,
      },
      transaction: this.transaction,
    }).then(WebhookDatabaseRepository.toDomain);
  }
}
