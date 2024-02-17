import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  Default,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import { KeyType, PixKey, PixKeyEntity } from '@zro/pix-keys/domain';
import {
  QrCodeStatic,
  QrCodeStaticEntity,
  QrCodeStaticState,
} from '@zro/pix-payments/domain';

type QrCodeStaticAttributes = QrCodeStatic & {
  userId?: string;
  keyId?: string;
  key?: string;
  keyType?: KeyType;
};
type QrCodeStaticCreationAttributes = QrCodeStaticAttributes;

@Table({
  tableName: 'pix_qr_code_static',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class QrCodeStaticModel
  extends DatabaseModel<QrCodeStaticAttributes, QrCodeStaticCreationAttributes>
  implements QrCodeStatic
{
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @Column({
    type: DataType.STRING,
    field: 'txid',
  })
  txId: string;

  @Column(DataType.STRING)
  description: string;

  @Column(DataType.STRING)
  summary: string;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      if (this.getDataValue('documentValue'))
        return parseInt(this.getDataValue('documentValue'));
      return null;
    },
  })
  documentValue: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  recipientCity!: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  recipientName!: string;

  @Column(DataType.TEXT)
  emv: string;

  @Column(DataType.STRING)
  ispb: string;

  @Column(DataType.STRING)
  paymentLinkUrl: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  keyId!: string;
  pixKey: PixKey;

  @AllowNull(false)
  @Column(DataType.STRING)
  key!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  keyType!: KeyType;

  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;
  user: User;

  @AllowNull(false)
  @Column(DataType.STRING)
  state: QrCodeStaticState;

  @AllowNull(true)
  @Column(DataType.STRING)
  ispbWithdrawal?: string;

  @AllowNull(true)
  @Column(DataType.DATE)
  expirationDate?: Date;

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  payableManyTimes: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt: Date;

  constructor(values?: QrCodeStaticCreationAttributes, options?: BuildOptions) {
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
  toDomain(): QrCodeStatic {
    const entity = new QrCodeStaticEntity(this.get({ plain: true }));
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
