import { DatabaseRepository } from '@zro/common';
import {
  PermissionType,
  PermissionTypeRepository,
} from '@zro/operations/domain';
import { PermissionTypeModel } from '@zro/operations/infrastructure';

export class PermissionTypeDatabaseRepository
  extends DatabaseRepository
  implements PermissionTypeRepository
{
  static toDomain(permissionTypeModel: PermissionTypeModel): PermissionType {
    return permissionTypeModel?.toDomain() ?? null;
  }

  async getAll(): Promise<PermissionType[]> {
    return PermissionTypeModel.findAll({
      transaction: this.transaction,
    }).then((data) => data.map(PermissionTypeDatabaseRepository.toDomain));
  }
}
