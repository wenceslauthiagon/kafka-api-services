import { DatabaseRepository } from '@zro/common';
import { Address, AddressRepository, User } from '@zro/users/domain';
import { AddressModel, UserModel } from '@zro/users/infrastructure';

export class AddressDatabaseRepository
  extends DatabaseRepository
  implements AddressRepository
{
  static toDomain(addressModel: AddressModel): Address {
    return addressModel?.toDomain() ?? null;
  }

  async getById(id: number): Promise<Address> {
    return AddressModel.findOne<AddressModel>({
      include: { model: UserModel, attributes: ['uuid'] },
      where: { id },
      transaction: this.transaction,
    }).then(AddressDatabaseRepository.toDomain);
  }

  async getByUser(user: User): Promise<Address> {
    return AddressModel.findOne<AddressModel>({
      where: { userId: user.id },
      transaction: this.transaction,
    }).then(AddressDatabaseRepository.toDomain);
  }
}
