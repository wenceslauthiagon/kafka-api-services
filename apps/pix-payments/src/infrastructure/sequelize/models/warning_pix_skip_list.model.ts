import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  WarningPixSkipList,
  WarningPixSkipListEntity,
} from '@zro/pix-payments/domain';

type WarningPixSkipListAttributes = WarningPixSkipList & {
  userId?: string;
};

type WarningPixSkipListCreationAttributes = WarningPixSkipListAttributes;

@Table({
  tableName: 'warning_pix_skip_list',
  timestamps: true,
  underscored: true,
})
export class WarningPixSkipListModel
  extends DatabaseModel<
    WarningPixSkipListAttributes,
    WarningPixSkipListCreationAttributes
  >
  implements WarningPixSkipList
{
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;
  user!: User;

  @AllowNull(false)
  @Column(DataType.STRING)
  clientAccountNumber!: string;

  @Column(DataType.TEXT)
  description?: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: WarningPixSkipListAttributes, options?: BuildOptions) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.uuid;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): WarningPixSkipList {
    const entity = new WarningPixSkipListEntity(this.get({ plain: true }));
    entity.user = new UserEntity({ uuid: this.userId });

    return entity;
  }
}
