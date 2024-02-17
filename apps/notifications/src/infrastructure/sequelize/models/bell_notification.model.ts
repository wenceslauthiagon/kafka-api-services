import {
  AllowNull,
  Column,
  DataType,
  Table,
  CreatedAt,
  UpdatedAt,
  Default,
  AutoIncrement,
  PrimaryKey,
} from 'sequelize-typescript';
import { BuildOptions, Optional } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  BellNotificationEntity,
  BellNotification,
} from '@zro/notifications/domain';
import { User, UserEntity } from '@zro/users/domain';

type BellNotificationAttributes = BellNotification & {
  userId?: number;
  userUuid?: string;
  campaignId?: string;
};
type BellNotificationCreationAttributes = Optional<
  BellNotificationAttributes,
  'id'
>;

@Table({
  tableName: 'Notifications',
  timestamps: true,
  underscored: true,
})
export class BellNotificationModel extends DatabaseModel<
  BellNotificationAttributes,
  BellNotificationCreationAttributes
> {
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.INTEGER)
  id: number;

  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  uuid: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  title: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  type: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  read: boolean;

  @AllowNull(false)
  @Column(DataType.STRING)
  description: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  userId: number;
  user: User;

  @AllowNull(true)
  @Column(DataType.UUID)
  userUuid: string;

  @AllowNull(true)
  @Column(DataType.UUID)
  campaignId?: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(
    values?: BellNotificationCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.id;
    this.userUuid = values?.userUuid ?? values?.user?.uuid ?? null;
  }

  toDomain(): BellNotificationEntity {
    const entity = new BellNotificationEntity(this.get({ plain: true }));
    entity.user = new UserEntity({ id: this.userId, uuid: this.userUuid });
    return entity;
  }
}
