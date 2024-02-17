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
  SmsTemplateEntity,
  SmsTemplate,
  SmsTemplateExtracted,
} from '@zro/notifications/domain';

type SmsTemplateAttributes = SmsTemplate;
type SmsTemplateCreationAttributes = Optional<SmsTemplateAttributes, 'id'>;

@Table({
  tableName: 'sms_templates',
  timestamps: true,
  underscored: true,
})
export class SmsTemplateModel
  extends DatabaseModel<SmsTemplateAttributes, SmsTemplateCreationAttributes>
  implements SmsTemplate
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  body?: string;

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

  constructor(values?: SmsTemplateCreationAttributes, options?: BuildOptions) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): SmsTemplateEntity {
    const entity = new SmsTemplateEntity(this.get({ plain: true }));
    return entity;
  }

  extract(data: Record<string, string>): SmsTemplateExtracted {
    return this.toDomain().extract(data);
  }
}
