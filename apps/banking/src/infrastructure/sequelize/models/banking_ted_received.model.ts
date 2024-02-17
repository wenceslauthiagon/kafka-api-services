import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  AutoIncrement,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  BankingTedReceived,
  BankingTedReceivedEntity,
} from '@zro/banking/domain';
import { Operation, OperationEntity } from '@zro/operations/domain';

type BankingTedReceivedAttributes = BankingTedReceived & {
  operationId?: string;
};
type BankingTedReceivedCreationAttributes = BankingTedReceivedAttributes;

@Table({
  tableName: 'BankingTedReceives',
  timestamps: true,
  underscored: true,
})
export class BankingTedReceivedModel
  extends DatabaseModel<
    BankingTedReceivedAttributes,
    BankingTedReceivedCreationAttributes
  >
  implements BankingTedReceived
{
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.INTEGER)
  id?: number;

  @AllowNull(false)
  @Column(DataType.UUID)
  operationId: string;
  operation: Operation;

  @Column({
    type: DataType.STRING,
    field: 'transaction_uuid',
  })
  transactionId?: string;

  @Column({
    type: DataType.STRING,
    field: 'sender_name',
  })
  ownerName?: string;

  @Column({
    type: DataType.STRING,
    field: 'sender_document',
  })
  ownerDocument?: string;

  @Column({
    type: DataType.STRING,
    field: 'sender_bank_account',
  })
  ownerBankAccount?: string;

  @Column({
    type: DataType.STRING,
    field: 'sender_bank_branch',
  })
  ownerBankBranch?: string;

  @Column({
    type: DataType.STRING,
    field: 'sender_bank_code',
  })
  ownerBankCode?: string;

  @Column({
    type: DataType.STRING,
    field: 'sender_bank_name',
  })
  ownerBankName?: string;

  @Column(DataType.STRING)
  bankStatementId?: string;

  @Column(DataType.DATE)
  notifiedAt?: Date;

  @CreatedAt
  createdAt?: Date;

  @UpdatedAt
  updatedAt?: Date;

  constructor(
    values?: BankingTedReceivedCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.operationId = values?.operationId ?? values?.operation?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): BankingTedReceived {
    const entity = new BankingTedReceivedEntity(this.get({ plain: true }));
    entity.operation = new OperationEntity({
      id: this.operationId,
    });

    return entity;
  }
}
