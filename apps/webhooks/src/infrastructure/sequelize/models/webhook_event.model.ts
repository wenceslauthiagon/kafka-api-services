import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  Default,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  WebhookEvent,
  WebhookEventEntity,
  WebhookType,
  Webhook,
  WebhookEventState,
  WebhookEntity,
} from '@zro/webhooks/domain';

type WebhookEventAttributes = WebhookEvent & { webhookId?: string };
type WebhookEventCreationAttributes = WebhookEventAttributes;

@Table({
  tableName: 'webhook_events',
  timestamps: true,
  underscored: true,
})
export class WebhookEventModel
  extends DatabaseModel<WebhookEventAttributes, WebhookEventCreationAttributes>
  implements WebhookEvent
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  state: WebhookEventState;

  @AllowNull(false)
  @Column(DataType.STRING)
  targetUrl: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  apiKey: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  webhookId: string;
  webhook: Webhook;

  @AllowNull(false)
  @Column(DataType.STRING)
  type: WebhookType;

  @AllowNull(false)
  @Column(DataType.STRING)
  accountNumber: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  agencyNumber: string;

  @AllowNull(false)
  @Column(DataType.JSON)
  data: Record<string, string | number | Date>;

  @AllowNull(true)
  @Column(DataType.STRING)
  httpStatusCodeResponse: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  retryLimit: Date;

  @AllowNull(true)
  @Column(DataType.DATE)
  lastRetry?: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: WebhookEventCreationAttributes, options?: BuildOptions) {
    super(values, options);
    this.webhookId = values?.webhookId ?? values?.webhook?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): WebhookEvent {
    const entity = new WebhookEventEntity(this.get({ plain: true }));

    entity.webhook = new WebhookEntity({
      id: this.webhookId,
    });

    return entity;
  }

  isInRetryLimit(): boolean {
    return this.toDomain().isInRetryLimit();
  }
}
