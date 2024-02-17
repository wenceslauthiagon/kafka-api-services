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
import {
  WarningPixBlockList,
  WarningPixBlockListEntity,
} from '@zro/pix-payments/domain';

type WarningPixBlockListAttributes = WarningPixBlockList & {
  userId?: string;
};

type WarningPixBlockListCreationAttributes = WarningPixBlockListAttributes;

@Table({
  tableName: 'warning_pix_block_list',
  timestamps: true,
  underscored: true,
})
export class WarningPixBlockListModel
  extends DatabaseModel<
    WarningPixBlockListAttributes,
    WarningPixBlockListCreationAttributes
  >
  implements WarningPixBlockList
{
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  cpf!: string;

  @Column(DataType.TEXT)
  description?: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  reviewAssignee!: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: WarningPixBlockListAttributes, options?: BuildOptions) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): WarningPixBlockList {
    const entity = new WarningPixBlockListEntity(this.get({ plain: true }));

    return entity;
  }
}
