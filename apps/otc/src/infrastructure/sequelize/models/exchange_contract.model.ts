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
import { FileEntity, File } from '@zro/storage/domain';
import { ExchangeContract, ExchangeContractEntity } from '@zro/otc/domain';

type ExchangeContractAttributes = ExchangeContract & { fileId?: string };

@Table({
  tableName: 'exchange_contracts',
  timestamps: true,
  underscored: true,
})
export class ExchangeContractModel
  extends DatabaseModel<ExchangeContractAttributes>
  implements ExchangeContract
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  contractNumber: string;

  @AllowNull(true)
  @Column({
    type: DataType.DECIMAL(16, 4),
    get(): number {
      return parseFloat(this.getDataValue('vetQuote'));
    },
  })
  vetQuote: number;

  @AllowNull(false)
  @Column({
    type: DataType.DECIMAL(16, 4),
    get(): number {
      return parseFloat(this.getDataValue('contractQuote'));
    },
  })
  contractQuote: number;

  @AllowNull(false)
  @Column({
    type: DataType.DECIMAL(16, 4),
    get(): number {
      return parseFloat(this.getDataValue('totalAmount'));
    },
  })
  totalAmount: number;

  @AllowNull(true)
  @Column(DataType.UUID)
  fileId?: string;
  file?: File;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: ExchangeContractAttributes, options?: BuildOptions) {
    super(values, options);
    this.fileId = values?.file?.id ?? values?.fileId ?? null;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): ExchangeContract {
    const entity = new ExchangeContractEntity(this.get({ plain: true }));

    entity.file = this.fileId && new FileEntity({ id: this.fileId });

    return entity;
  }
}
