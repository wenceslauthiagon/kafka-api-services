import { Transaction } from 'sequelize';
import {
  DatabaseRepository,
  Pagination,
  TPaginationResponse,
  paginationToDomain,
  paginationWhere,
} from '@zro/common';
import { System, SystemRepository } from '@zro/otc/domain';
import { SystemModel } from '@zro/otc/infrastructure';

export class SystemDatabaseRepository
  extends DatabaseRepository
  implements SystemRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(model: SystemModel): System {
    return model?.toDomain() ?? null;
  }

  async create(system: System): Promise<System> {
    const createdSystem = await SystemModel.create<SystemModel>(system, {
      transaction: this.transaction,
    });

    system.id = createdSystem.id;
    system.createdAt = createdSystem.createdAt;

    return system;
  }

  async getById(id: string): Promise<System> {
    return SystemModel.findOne<SystemModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(SystemDatabaseRepository.toDomain);
  }

  async getByName(name: string): Promise<System> {
    return SystemModel.findOne<SystemModel>({
      where: {
        name,
      },
      transaction: this.transaction,
    }).then(SystemDatabaseRepository.toDomain);
  }

  async getAll(pagination: Pagination): Promise<TPaginationResponse<System>> {
    return SystemModel.findAndCountAll<SystemModel>({
      ...paginationWhere(pagination),
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(SystemDatabaseRepository.toDomain),
      ),
    );
  }
}
