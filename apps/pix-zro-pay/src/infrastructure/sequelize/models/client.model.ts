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
  Client,
  ClientEntity,
  Company,
  CompanyEntity,
} from '@zro/pix-zro-pay/domain';

type ClientAttributes = Client & {
  companyId: number;
};
type ClientCreationAttributes = ClientAttributes;

@Table({
  tableName: 'clients',
  timestamps: true,
  underscored: true,
})
export class ClientModel
  extends DatabaseModel<ClientAttributes, ClientCreationAttributes>
  implements Client
{
  @PrimaryKey
  @AllowNull(false)
  @AutoIncrement
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('id'));
    },
  })
  id: number;

  @Column(DataType.STRING)
  name?: string;

  @Column(DataType.STRING)
  email?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  document: string;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('companyId'));
    },
  })
  companyId: number;
  company: Company;

  @Column(DataType.BOOLEAN)
  isBlacklisted?: boolean;

  @Column(DataType.BOOLEAN)
  isValid?: boolean;

  @Column(DataType.DATE)
  birthdate?: Date;

  @Column(DataType.BOOLEAN)
  isRestricted?: boolean;

  @Column(DataType.STRING)
  errorMessage?: string;

  @Column(DataType.DATE)
  verifiedAt?: Date;

  @CreatedAt
  createdAt?: Date;

  @UpdatedAt
  updatedAt?: Date;

  constructor(values?: ClientAttributes, options?: BuildOptions) {
    super(values, options);
    this.companyId = values?.companyId ?? values?.company?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): Client {
    const entity = new ClientEntity(this.get({ plain: true }));
    entity.company = new CompanyEntity({ id: this.companyId });

    delete entity['companyId'];
    return entity;
  }
}
