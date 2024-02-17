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
  SmsEntity,
  Sms,
  SmsState,
  SmsTemplate,
} from '@zro/notifications/domain';
import { User, UserEntity } from '@zro/users/domain';
import { SmsTemplateModel } from './sms_template.model';

type SmsAttributes = Sms & { userId?: string; templateId?: string };
type SmsCreationAttributes = Optional<SmsAttributes, 'id'>;

@Table({
  tableName: 'sms',
  timestamps: true,
  underscored: true,
})
export class SmsModel
  extends DatabaseModel<SmsAttributes, SmsCreationAttributes>
  implements Sms
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  phoneNumber: string;

  @AllowNull(false)
  @Default(SmsState.PENDING)
  @Column(DataType.STRING)
  state: SmsState;

  @AllowNull(false)
  @Column(DataType.TEXT)
  body: string;

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

  @BelongsTo(() => SmsTemplateModel, 'template_id')
  template: SmsTemplate;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: SmsCreationAttributes, options?: BuildOptions) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.uuid ?? null;
    this.templateId = values?.templateId ?? values?.template?.id ?? null;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): SmsEntity {
    const entity = new SmsEntity(this.get({ plain: true }));
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
