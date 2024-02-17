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
  Webhook,
  WebhookEntity,
  WebhookState,
  WebhookType,
} from '@zro/webhooks/domain';

type WebhookAttributes = Webhook;
type WebhookCreationAttributes = WebhookAttributes;

@Table({
  tableName: 'webhooks',
  timestamps: true,
  underscored: true,
})
export class WebhookModel
  extends DatabaseModel<WebhookAttributes, WebhookCreationAttributes>
  implements Webhook
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  type: WebhookType;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
  })
  targetUrl: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
  })
  accountNumber: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
  })
  agencyNumber: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  userId: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
  })
  apiKey: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  state: WebhookState;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: WebhookCreationAttributes, options?: BuildOptions) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): Webhook {
    const entity = new WebhookEntity(this.get({ plain: true }));
    return entity;
  }
}
