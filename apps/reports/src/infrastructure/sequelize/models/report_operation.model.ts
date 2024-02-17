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
import {
  ReportOperation,
  ReportOperationEntity,
  OperationType,
} from '@zro/reports/domain';
import {
  Operation,
  OperationEntity,
  TransactionType,
  TransactionTypeEntity,
  Currency,
  CurrencyEntity,
} from '@zro/operations/domain';
import { PersonType, User, UserEntity } from '@zro/users/domain';

type ReportOperationAttributes = ReportOperation & {
  operationId?: string;
  operationDate?: Date;
  operationValue?: number;
  transactionTypeId?: number;
  transactionTypeTitle?: string;
  transactionTypeTag?: string;
  thirdPartId?: string;
  thirdPartName?: string;
  thirdPartDocument?: string;
  thirdPartDocumentType?: PersonType;
  clientId?: string;
  clientName?: string;
  clientDocument?: string;
  clientDocumentType?: PersonType;
  currencySymbol?: string;
};
type ReportOperationCreationAttributes = ReportOperationAttributes;

@Table({
  tableName: 'report_operations',
  timestamps: true,
  underscored: true,
})
export class ReportOperationModel
  extends DatabaseModel<
    ReportOperationAttributes,
    ReportOperationCreationAttributes
  >
  implements ReportOperation
{
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  operationId: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  operationDate: Date;

  @AllowNull(false)
  @Default(0)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('operationValue'));
    },
  })
  operationValue: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  operationType: OperationType;
  operation: Operation;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  transactionTypeId: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  transactionTypeTitle: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  transactionTypeTag: string;
  transactionType: TransactionType;

  @Column(DataType.UUID)
  thirdPartId: string;

  @Column(DataType.STRING)
  thirdPartName: string;

  @Column(DataType.STRING)
  thirdPartDocument: string;

  @Column(DataType.STRING)
  thirdPartDocumentType: PersonType;
  thirdPart: User;

  @Column(DataType.STRING)
  thirdPartBankCode: string;

  @Column(DataType.STRING)
  thirdPartBranch: string;

  @Column(DataType.STRING)
  thirdPartAccountNumber: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  clientId: string;

  @Column(DataType.STRING)
  clientName: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  clientDocument: string;

  @Column(DataType.STRING)
  clientDocumentType: PersonType;
  client: User;

  @AllowNull(false)
  @Column(DataType.STRING)
  clientBankCode: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  clientBranch: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  clientAccountNumber: string;

  @Column(DataType.STRING)
  currencySymbol: string;
  currency: Currency;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: ReportOperationAttributes, options?: BuildOptions) {
    super(values, options);
    this.operationId = values?.operationId ?? values?.operation?.id;
    this.operationDate = values?.operationDate ?? values?.operation?.createdAt;
    this.operationValue = values?.operationValue ?? values?.operation?.value;
    this.transactionTypeId =
      values?.transactionTypeId ?? values?.transactionType?.id;
    this.transactionTypeTitle =
      values?.transactionTypeTitle ?? values?.transactionType?.title;
    this.transactionTypeTag =
      values?.transactionTypeTag ?? values?.transactionType?.tag;
    this.thirdPartId = values?.thirdPartId ?? values?.thirdPart?.uuid;
    this.thirdPartName = values?.thirdPartName ?? values?.thirdPart?.name;
    this.thirdPartDocument =
      values?.thirdPartDocument ?? values?.thirdPart?.document;
    this.thirdPartDocumentType =
      values?.thirdPartDocumentType ?? values?.thirdPart?.type;
    this.clientId = values?.clientId ?? values?.client?.uuid;
    this.clientName = values?.clientName ?? values?.client?.name;
    this.clientDocument = values?.clientDocument ?? values?.client?.document;
    this.clientDocumentType =
      values?.clientDocumentType ?? values?.client?.type;
    this.currencySymbol = values?.currencySymbol ?? values?.currency?.symbol;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): ReportOperation {
    const entity = new ReportOperationEntity(this.get({ plain: true }));

    entity.operation = new OperationEntity({
      id: this.operationId,
      createdAt: this.operationDate,
      value: this.operationValue,
    });

    entity.transactionType = new TransactionTypeEntity({
      id: this.transactionTypeId,
      title: this.transactionTypeTitle,
      tag: this.transactionTypeTag,
    });

    if (
      this.thirdPartId ||
      this.thirdPartName ||
      this.thirdPartDocument ||
      this.thirdPartDocumentType
    ) {
      entity.thirdPart = new UserEntity({
        ...(this.thirdPartId && { uuid: this.thirdPartId }),
        ...(this.thirdPartName && { name: this.thirdPartName }),
        ...(this.thirdPartDocument && { document: this.thirdPartDocument }),
        ...(this.thirdPartDocumentType && { type: this.thirdPartDocumentType }),
      });
    }

    entity.client = new UserEntity({
      uuid: this.clientId,
      name: this.clientName,
      document: this.clientDocument,
      type: this.clientDocumentType,
    });

    entity.currency = new CurrencyEntity({
      symbol: this.currencySymbol,
    });

    Reflect.deleteProperty(entity, 'operationId');
    Reflect.deleteProperty(entity, 'operationDate');
    Reflect.deleteProperty(entity, 'operationValue');

    Reflect.deleteProperty(entity, 'transactionTypeId');
    Reflect.deleteProperty(entity, 'transactionTypeTitle');
    Reflect.deleteProperty(entity, 'transactionTypeTag');

    Reflect.deleteProperty(entity, 'thirdPartId');
    Reflect.deleteProperty(entity, 'thirdPartName');
    Reflect.deleteProperty(entity, 'thirdPartDocument');
    Reflect.deleteProperty(entity, 'thirdPartDocumentType');

    Reflect.deleteProperty(entity, 'clientId');
    Reflect.deleteProperty(entity, 'clientName');
    Reflect.deleteProperty(entity, 'clientDocument');
    Reflect.deleteProperty(entity, 'clientDocumentType');

    Reflect.deleteProperty(entity, 'currencySymbol');

    return entity;
  }
}
