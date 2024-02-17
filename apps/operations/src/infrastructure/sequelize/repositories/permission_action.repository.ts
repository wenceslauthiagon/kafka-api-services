import { Op } from 'sequelize';
import {
  DatabaseRepository,
  Pagination,
  TPaginationResponse,
  paginationToDomain,
  paginationWhere,
} from '@zro/common';
import {
  PermissionType,
  PermissionAction,
  PermissionActionRepository,
} from '@zro/operations/domain';
import {
  PermissionActionModel,
  PermissionTypeActionModel,
} from '@zro/operations/infrastructure';

export class PermissionActionDatabaseRepository
  extends DatabaseRepository
  implements PermissionActionRepository
{
  static toDomain(
    permissionActionModel: PermissionActionModel,
  ): PermissionAction {
    return permissionActionModel?.toDomain() ?? null;
  }

  async getAllByFilter(
    pagination: Pagination,
    permissionTypes?: PermissionType[],
  ): Promise<TPaginationResponse<PermissionAction>> {
    return PermissionActionModel.findAndCountAll({
      ...paginationWhere(pagination),
      ...(permissionTypes?.length && {
        include: {
          model: PermissionTypeActionModel,
          attributes: [],
          where: {
            permissionTypeTag: {
              [Op.in]: permissionTypes.map(({ tag }) => tag),
            },
          },
        },
      }),
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(PermissionActionDatabaseRepository.toDomain),
      ),
    );
  }
}
