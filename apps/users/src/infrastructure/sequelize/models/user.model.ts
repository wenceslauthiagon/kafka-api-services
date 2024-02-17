import { BuildOptions, Optional } from 'sequelize';
import {
  AllowNull,
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Default,
  DeletedAt,
  IsUUID,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';
import {
  User,
  PersonType,
  UserEntity,
  UserState,
  BankOnboardingState,
} from '@zro/users/domain';

export type UserAttributes = User & { referredById: User['id'] };
export type UserCreationAttributes = Optional<UserAttributes, 'id'>;

@Table({
  tableName: 'Users',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class UserModel
  extends Model<UserAttributes, UserCreationAttributes>
  implements User
{
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.INTEGER)
  id: number;

  @IsUUID(4)
  @Unique
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  uuid: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name: string;

  @Column(DataType.STRING)
  fullName: string;

  @Column({
    type: DataType.STRING,
    field: 'cpf',
  })
  document: string;

  @Default(PersonType.NATURAL_PERSON)
  @Column(DataType.STRING)
  type: PersonType;

  @AllowNull(false)
  @Column(DataType.STRING)
  phoneNumber: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  password: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  pin: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  pinHasCreated: boolean;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  eula: boolean;

  @AllowNull(false)
  @Default('000000') // TODO: old api uses hashSync(phone_number)
  @Column(DataType.STRING)
  inviteCode: string;

  @Column({
    type: DataType.INTEGER,
    field: 'telegram_confirm_code',
  })
  confirmCode: number;

  @Column({
    type: DataType.STRING,
    field: 'referral_code',
  })
  referralCode: string;

  @Column({
    type: DataType.INTEGER,
    field: 'referred_by',
  })
  referredById: number;
  referredBy: User;

  @AllowNull(true)
  @Column(DataType.STRING)
  fcmToken: string;

  @Default(true)
  @Column(DataType.BOOLEAN)
  active: boolean;

  @AllowNull(false)
  @Default(UserState.PENDING)
  @Column(DataType.STRING)
  state: UserState;

  @Column(DataType.JSONB)
  props?: { [key: string]: string };

  @Column(DataType.STRING)
  email: string;

  @Column(DataType.STRING)
  bankOnboardingState: BankOnboardingState;

  @Column(DataType.STRING)
  motherName?: string;

  @Column(DataType.DATE)
  birthDate?: Date;

  @Column(DataType.STRING)
  genre?: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt: Date;

  constructor(values?: UserCreationAttributes, options?: BuildOptions) {
    super(values, options);
    this.referredById = values?.referredById ?? values?.referredBy?.id ?? null;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): User {
    const entity = new UserEntity(this.get({ plain: true }));
    entity.referredBy = this.referredById
      ? new UserEntity({ id: this.referredById })
      : null;
    return entity;
  }
}
