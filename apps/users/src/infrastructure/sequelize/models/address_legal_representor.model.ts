import { BuildOptions, Optional } from 'sequelize';
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import {
  AddressLegalRepresentor,
  AddressLegalRepresentorEntity,
} from '@zro/users/domain';

export type AddressLegalRepresentorAttributes = AddressLegalRepresentor;
export type AddressLegalRepresentorCreationAttributes = Optional<
  AddressLegalRepresentorAttributes,
  'id'
>;

@Table({
  tableName: 'addresses_legal_representor',
  timestamps: true,
  underscored: true,
})
export class AddressLegalRepresentorModel
  extends Model<
    AddressLegalRepresentorAttributes,
    AddressLegalRepresentorCreationAttributes
  >
  implements AddressLegalRepresentor
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  zipCode: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  street: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  number: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  neighborhood: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  city: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  federativeUnit: string;

  @Column(DataType.STRING)
  country: string;

  @Column(DataType.STRING)
  complement?: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(
    values?: AddressLegalRepresentorCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): AddressLegalRepresentor {
    const entity = new AddressLegalRepresentorEntity(this.get({ plain: true }));
    return entity;
  }
}
