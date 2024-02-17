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
import { User, PersonType, UserEntity } from '@zro/users/domain';
import { KeyType, PixKey, PixKeyEntity } from '@zro/pix-keys/domain';
import {
  QrCodeDynamic,
  QrCodeDynamicEntity,
  PixQrCodeDynamicState,
} from '@zro/pix-payments/domain';

type QrCodeDynamicAttributes = QrCodeDynamic & {
  userId?: string;
  keyId?: string;
  key?: string;
  keyType?: KeyType;
};
type QrCodeDynamicCreationAttributes = QrCodeDynamicAttributes;

@Table({
  tableName: 'pix_qr_code_dynamic',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class QrCodeDynamicModel
  extends DatabaseModel<
    QrCodeDynamicAttributes,
    QrCodeDynamicCreationAttributes
  >
  implements QrCodeDynamic
{
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;
  user: User;

  @AllowNull(false)
  @Column(DataType.UUID)
  keyId!: string;
  pixKey: PixKey;

  @AllowNull(true)
  @Column(DataType.STRING)
  key!: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  keyType!: KeyType;

  @AllowNull(false)
  @Column(DataType.STRING)
  recipientCity: string;

  @Column(DataType.STRING)
  recipientName?: string;

  @Column(DataType.STRING)
  recipientAddress?: string;

  @Column(DataType.STRING)
  recipientZipCode?: string;

  @Column(DataType.STRING)
  recipientFeredativeUnit?: string;

  @Column(DataType.STRING)
  recipientDocument?: string;

  @Column(DataType.STRING)
  recipientPersonType?: PersonType;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      if (this.getDataValue('documentValue'))
        return parseInt(this.getDataValue('documentValue'));
      return null;
    },
  })
  documentValue?: number;

  @Column(DataType.STRING)
  summary?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  description: string;

  @Column(DataType.STRING)
  payerName?: string;

  @Column(DataType.STRING)
  payerPersonType?: PersonType;

  @Column(DataType.STRING)
  payerDocument?: string;

  @Column(DataType.STRING)
  payerEmail?: string;

  @Column(DataType.STRING)
  payerCity?: string;

  @Column(DataType.STRING)
  payerPhone?: string;

  @Column(DataType.STRING)
  payerAddress?: string;

  @Column(DataType.STRING)
  payerRequest?: string;

  @Column(DataType.BOOLEAN)
  allowUpdate?: boolean;

  @Column(DataType.BOOLEAN)
  allowUpdateChange?: boolean;

  @Column(DataType.BOOLEAN)
  allowUpdateWithdrawal?: boolean;

  @Column(DataType.DATE)
  expirationDate?: Date;

  @Column(DataType.DATE)
  dueDate?: Date;

  @AllowNull(false)
  @Column(DataType.STRING)
  state: PixQrCodeDynamicState;

  @Column({
    type: DataType.STRING,
    field: 'txid',
  })
  txId: string;

  @Column(DataType.STRING)
  paymentLinkUrl?: string;

  @Column(DataType.TEXT)
  emv?: string;

  @Column(DataType.UUID)
  externalId?: string;

  @Column(DataType.TEXT)
  payloadJws?: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt: Date;

  constructor(
    values?: QrCodeDynamicCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.uuid;
    this.keyId = values?.keyId ?? values?.pixKey?.id;
    this.key = values?.key ?? values?.pixKey?.key;
    this.keyType = values?.keyType ?? values?.pixKey?.type;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): QrCodeDynamic {
    const entity = new QrCodeDynamicEntity(this.get({ plain: true }));
    entity.user = new UserEntity({ uuid: this.userId });
    entity.pixKey = new PixKeyEntity({
      id: this.keyId,
      key: this.key,
      type: this.keyType,
      user: entity.user,
    });

    delete entity['userId'];
    delete entity['keyId'];
    delete entity['key'];
    delete entity['keyType'];

    return entity;
  }
}
