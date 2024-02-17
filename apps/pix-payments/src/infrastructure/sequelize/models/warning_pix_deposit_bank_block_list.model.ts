import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  WarningPixDepositBankBlockList,
  WarningPixDepositBankBlockListEntity,
} from '@zro/pix-payments/domain';

type WarningPixDepositBankBlockListAttributes = WarningPixDepositBankBlockList;

type WarningPixDepositBankBlockListCreationAttributes =
  WarningPixDepositBankBlockListAttributes;

@Table({
  tableName: 'warning_pix_deposit_bank_block_list',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class WarningPixDepositBankBlockListModel
  extends DatabaseModel<
    WarningPixDepositBankBlockListAttributes,
    WarningPixDepositBankBlockListCreationAttributes
  >
  implements WarningPixDepositBankBlockList
{
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  cnpj: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name: string;

  @Column(DataType.STRING)
  description?: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt: Date;

  constructor(
    values?: WarningPixDepositBankBlockListAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): WarningPixDepositBankBlockList {
    const entity = new WarningPixDepositBankBlockListEntity(
      this.get({ plain: true }),
    );

    return entity;
  }
}
