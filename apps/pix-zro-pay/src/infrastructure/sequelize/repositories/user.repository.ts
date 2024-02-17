import { DatabaseRepository } from '@zro/common';
import { User, UserRepository } from '@zro/pix-zro-pay/domain';
import { UserModel } from '@zro/pix-zro-pay/infrastructure';

export class UserDatabaseRepository
  extends DatabaseRepository
  implements UserRepository
{
  static toDomain(userModel: UserModel): User {
    return userModel?.toDomain() ?? null;
  }

  async create(user: User): Promise<User> {
    const userGenerated = await UserModel.create<UserModel>(user, {
      transaction: this.transaction,
    });

    user.createdAt = userGenerated.createdAt;
    return user;
  }

  async update(user: User): Promise<User> {
    await UserModel.update<UserModel>(user, {
      where: { id: user.id },
      transaction: this.transaction,
    });

    return user;
  }

  async getById(id: number): Promise<User> {
    return UserModel.findOne<UserModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(UserDatabaseRepository.toDomain);
  }
}
