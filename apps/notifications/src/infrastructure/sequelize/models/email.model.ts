import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  Default,
  BelongsTo,
} from 'sequelize-typescript';
import { Optional, BuildOptions } from 'sequelize';

import { DatabaseModel } from '@zro/common';
import {
  EmailEntity,
  Email,
  EmailState,
  EmailTemplate,
} from '@zro/notifications/domain';
import { User, UserEntity } from '@zro/users/domain';
import { EmailTemplateModel } from './email_template.model';

type EmailAttributes = Email & { userId?: string; templateId?: string };
type EmailCreationAttributes = Optional<EmailAttributes, 'id'>;

@Table({
  tableName: 'emails',
  timestamps: true,
  underscored: true,
})
export class EmailModel
  extends DatabaseModel<EmailAttributes, EmailCreationAttributes>
  implements Email
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  to: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  from: string;

  @AllowNull(false)
  @Default(EmailState.PENDING)
  @Column(DataType.STRING)
  state: EmailState;

  @AllowNull(true)
  @Column(DataType.STRING)
  title?: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  body?: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  html?: string;

  @AllowNull(true)
  @Column(DataType.UUID)
  userId: string;

  @AllowNull(true)
  @Column(DataType.UUID)
  issuedBy?: string;

  @AllowNull(true)
  @Column(DataType.UUID)
  templateId?: string;

  // Don't use belongs to here because User is not a notification model.
  user?: User;

  @BelongsTo(() => EmailTemplateModel, 'template_id')
  template: EmailTemplate;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: EmailCreationAttributes, options?: BuildOptions) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.uuid ?? null;
    this.templateId = values?.templateId ?? values?.template?.id ?? null;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): EmailEntity {
    const entity = new EmailEntity(this.get({ plain: true }));
    entity.user = this.userId && new UserEntity({ uuid: this.userId });
    return entity;
  }

  isSent(): boolean {
    return this.toDomain().isSent();
  }

  isFailed(): boolean {
    return this.toDomain().isFailed();
  }
}
