import { Transaction, Op } from 'sequelize';
import { DatabaseRepository, getMoment } from '@zro/common';
import { Signup, SignupRepository, SignupState } from '@zro/signup/domain';
import { SignupModel } from '@zro/signup/infrastructure';

export class SignupDatabaseRepository
  extends DatabaseRepository
  implements SignupRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(signupModel: SignupModel): Signup {
    return signupModel?.toDomain() ?? null;
  }

  async getById(id: string): Promise<Signup> {
    return SignupModel.findOne<SignupModel>({
      where: { id },
      transaction: this.transaction,
      lock: this.transaction?.LOCK.UPDATE,
    }).then(SignupDatabaseRepository.toDomain);
  }

  async getByPhoneNumber(phoneNumber: string): Promise<Signup> {
    return SignupModel.findOne<SignupModel>({
      where: { phoneNumber },
      transaction: this.transaction,
      lock: this.transaction?.LOCK.UPDATE,
    }).then(SignupDatabaseRepository.toDomain);
  }

  async update(signup: Signup): Promise<Signup> {
    await SignupModel.update(signup, {
      where: { id: signup.id },
      transaction: this.transaction,
    });

    return signup;
  }

  async create(signup: Signup): Promise<Signup> {
    return SignupModel.create(signup, {
      transaction: this.transaction,
    }).then(SignupDatabaseRepository.toDomain);
  }

  async getAllExpiredSignups(expiration: number): Promise<Signup[]> {
    return SignupModel.findAll<SignupModel>({
      where: {
        state: SignupState.PENDING,
        createdAt: {
          [Op.lte]: getMoment().subtract(expiration, 'minutes').toDate(),
        },
      },
      transaction: this.transaction,
      lock: this.transaction?.LOCK.UPDATE,
    }).then((result) => {
      return result.map(SignupDatabaseRepository.toDomain);
    });
  }
}
