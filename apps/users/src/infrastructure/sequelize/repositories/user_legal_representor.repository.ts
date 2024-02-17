import { DatabaseRepository } from '@zro/common';
import {
  User,
  UserLegalRepresentor,
  UserLegalRepresentorRepository,
} from '@zro/users/domain';
import {
  AddressLegalRepresentorModel,
  UserLegalRepresentorModel,
} from '@zro/users/infrastructure';

export class UserLegalRepresentorDatabaseRepository
  extends DatabaseRepository
  implements UserLegalRepresentorRepository
{
  static toDomain(
    UserLegalRepresentorModel: UserLegalRepresentorModel,
  ): UserLegalRepresentor {
    return UserLegalRepresentorModel?.toDomain() ?? null;
  }

  async getAllByUser(user: User): Promise<UserLegalRepresentor[]> {
    return UserLegalRepresentorModel.findAll<UserLegalRepresentorModel>({
      where: {
        userId: user.uuid,
      },
      include: {
        model: AddressLegalRepresentorModel,
      },

      transaction: this.transaction,
    }).then((result) => {
      return result.map(UserLegalRepresentorDatabaseRepository.toDomain);
    });
  }
}
