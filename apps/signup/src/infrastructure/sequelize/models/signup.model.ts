import { BuildOptions } from 'sequelize';
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  IsUUID,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Signup, SignupEntity, SignupState } from '@zro/signup/domain';
import { User, UserEntity } from '@zro/users/domain';

export type SignupAttributes = Signup & {
  userId?: User['uuid'];
  duplicateId?: User['uuid'];
};
export type SignupCreationAttributes = SignupAttributes;

@Table({
  tableName: 'signup',
  timestamps: true,
  underscored: true,
})
export class SignupModel
  extends Model<SignupAttributes, SignupCreationAttributes>
  implements Signup
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @IsUUID(4)
  @Default(null)
  @Column(DataType.UUID)
  userId: string;
  user: User;

  @IsUUID(4)
  @Default(null)
  @Column(DataType.UUID)
  duplicateId: string;
  duplicate: User;

  @Column(DataType.STRING)
  name: string;

  @Column(DataType.STRING)
  phoneNumber: string;

  @Column(DataType.STRING)
  email: string;

  @Column(DataType.STRING)
  password: string;

  @Column(DataType.INTEGER)
  confirmCode: string;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  confirmAttempts: number;

  @Column(DataType.STRING)
  referralCode: string;

  @AllowNull(false)
  @Default(SignupState.PENDING)
  @Column(DataType.STRING)
  state: SignupState;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: SignupCreationAttributes, options?: BuildOptions) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.uuid;
    this.duplicateId = values?.duplicateId ?? values?.duplicate?.uuid;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): Signup {
    const entity = new SignupEntity(this.get({ plain: true }));

    if (this.userId) {
      entity.user = new UserEntity({ uuid: this.userId });
    }
    if (this.duplicateId) {
      entity.duplicate = new UserEntity({ uuid: this.duplicateId });
    }

    return entity;
  }

  isPending(): boolean {
    return this.toDomain().isPending();
  }

  isFinalState(): boolean {
    return this.toDomain().isFinalState();
  }
}
