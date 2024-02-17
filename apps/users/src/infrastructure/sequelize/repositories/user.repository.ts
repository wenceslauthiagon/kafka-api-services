import { Op } from 'sequelize';
import {
  DatabaseRepository,
  Pagination,
  TPaginationResponse,
  paginationToDomain,
  paginationWhere,
  getMoment,
} from '@zro/common';
import {
  BankOnboardingState,
  User,
  UserRepository,
  UserState,
} from '@zro/users/domain';
import { UserModel } from '@zro/users/infrastructure';

export class UserDatabaseRepository
  extends DatabaseRepository
  implements UserRepository
{
  static toDomain(userModel: UserModel): User {
    return userModel?.toDomain() ?? null;
  }

  async create(user: User): Promise<User> {
    return UserModel.create(user, { transaction: this.transaction }).then(
      UserDatabaseRepository.toDomain,
    );
  }

  async update(user: User): Promise<User> {
    await UserModel.update(user, {
      where: { id: user.id },
      transaction: this.transaction,
    });

    return user;
  }

  async getById(id: number): Promise<User> {
    return UserModel.findOne<UserModel>({
      where: { id },
      transaction: this.transaction,
    }).then(UserDatabaseRepository.toDomain);
  }

  async getByUuid(uuid: string): Promise<User> {
    return UserModel.findOne<UserModel>({
      where: { uuid },
      transaction: this.transaction,
    }).then(UserDatabaseRepository.toDomain);
  }

  async getByDocument(cpf: string): Promise<User> {
    return UserModel.findOne<UserModel>({
      where: { document: cpf },
      transaction: this.transaction,
    }).then(UserDatabaseRepository.toDomain);
  }

  async getByEmail(email: string): Promise<User> {
    return UserModel.findOne<UserModel>({
      where: { email },
      transaction: this.transaction,
    }).then(UserDatabaseRepository.toDomain);
  }

  async getByPhoneNumber(phoneNumber: string): Promise<User> {
    return UserModel.findOne<UserModel>({
      where: { phoneNumber },
      transaction: this.transaction,
    }).then(UserDatabaseRepository.toDomain);
  }

  async getByReferralCode(referralCode: string): Promise<User> {
    return UserModel.findOne<UserModel>({
      where: { referralCode },
      transaction: this.transaction,
    }).then(UserDatabaseRepository.toDomain);
  }

  async getAllExpiredUsers(expiration: number): Promise<User[]> {
    return UserModel.findAll<UserModel>({
      where: {
        state: UserState.PENDING,
        createdAt: {
          [Op.lte]: getMoment().subtract(expiration, 'minutes').toDate(),
        },
      },
      transaction: this.transaction,
    }).then((result) => {
      return result.map(UserDatabaseRepository.toDomain);
    });
  }

  async getAllActiveAndBankOnboardingStateIsCompleteUsers(
    pagination: Pagination,
  ): Promise<TPaginationResponse<User>> {
    return UserModel.findAndCountAll<UserModel>({
      ...paginationWhere(pagination),
      where: {
        state: UserState.ACTIVE,
        bankOnboardingState: BankOnboardingState.COMPLETE,
      },
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(UserDatabaseRepository.toDomain),
      ),
    );
  }

  async delete(user: User): Promise<void> {
    await UserModel.destroy<UserModel>({
      where: { id: user.id },
      transaction: this.transaction,
    });
  }
}
