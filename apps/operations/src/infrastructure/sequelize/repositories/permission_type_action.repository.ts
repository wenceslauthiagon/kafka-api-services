import { DatabaseRepository } from '@zro/common';
import {
  PermissionTypeAction,
  PermissionTypeActionRepository,
} from '@zro/operations/domain';
import { PermissionTypeActionModel } from '@zro/operations/infrastructure';

export class PermissionTypeActionDatabaseRepository
  extends DatabaseRepository
  implements PermissionTypeActionRepository
{
  static toDomain(
    permissionTypeActionModel: PermissionTypeActionModel,
  ): PermissionTypeAction {
    return permissionTypeActionModel?.toDomain() ?? null;
  }

  async getAll(): Promise<PermissionTypeAction[]> {
    return PermissionTypeActionModel.findAll({
      transaction: this.transaction,
    }).then((data) =>
      data.map(PermissionTypeActionDatabaseRepository.toDomain),
    );
  }
}
