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
import { Optional, BuildOptions } from 'sequelize';

import { DatabaseModel } from '@zro/common';
import {
  EmailTemplateEntity,
  EmailTemplate,
  EmailTemplateExtracted,
} from '@zro/notifications/domain';

type EmailTemplateAttributes = EmailTemplate;
type EmailTemplateCreationAttributes = Optional<EmailTemplateAttributes, 'id'>;

@Table({
  tableName: 'email_templates',
  timestamps: true,
  underscored: true,
})
export class EmailTemplateModel
  extends DatabaseModel<
    EmailTemplateAttributes,
    EmailTemplateCreationAttributes
  >
  implements EmailTemplate
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  title?: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  body?: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  html?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  tag: string;

  @AllowNull(true)
  @Column(DataType.ARRAY(DataType.STRING))
  markups?: string[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(
    values?: EmailTemplateCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): EmailTemplateEntity {
    const entity = new EmailTemplateEntity(this.get({ plain: true }));
    return entity;
  }

  extract(data: Record<string, string>): EmailTemplateExtracted {
    return this.toDomain().extract(data);
  }
}
