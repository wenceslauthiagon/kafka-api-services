import { Op } from 'sequelize';
import {
  DatabaseRepository,
  Pagination,
  paginationToDomain,
  TPaginationResponse,
  paginationWhere,
  getMoment,
} from '@zro/common';
import { User } from '@zro/users/domain';
import { Operation, Wallet } from '@zro/operations/domain';
import {
  PixDeposit,
  PixDevolution,
  PixDevolutionRepository,
  PixDevolutionState,
  ThresholdDateComparisonType,
} from '@zro/pix-payments/domain';
import {
  PixDepositModel,
  PixDevolutionModel,
} from '@zro/pix-payments/infrastructure';

export class PixDevolutionDatabaseRepository
  extends DatabaseRepository
  implements PixDevolutionRepository
{
  static toDomain(devolutionModel: PixDevolutionModel): PixDevolution {
    return devolutionModel?.toDomain() ?? null;
  }

  async create(devolution: PixDevolution): Promise<PixDevolution> {
    const devolutionGenerated =
      await PixDevolutionModel.create<PixDevolutionModel>(devolution, {
        transaction: this.transaction,
      });

    devolution.createdAt = devolutionGenerated.createdAt;
    devolution.updatedAt = devolutionGenerated.updatedAt;
    return devolution;
  }

  async update(devolution: PixDevolution): Promise<PixDevolution> {
    await PixDevolutionModel.update<PixDevolutionModel>(devolution, {
      where: { id: devolution.id },
      transaction: this.transaction,
    });

    return devolution;
  }

  async getById(id: string): Promise<PixDevolution> {
    return PixDevolutionModel.findOne<PixDevolutionModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(PixDevolutionDatabaseRepository.toDomain);
  }

  async getByIdAndWallet(id: string, wallet: Wallet): Promise<PixDevolution> {
    return PixDevolutionModel.findOne<PixDevolutionModel>({
      where: {
        id,
        walletId: wallet.uuid,
      },
      transaction: this.transaction,
    }).then(PixDevolutionDatabaseRepository.toDomain);
  }

  async countByDeposit(deposit: PixDeposit): Promise<number> {
    return PixDevolutionModel.count<PixDevolutionModel>({
      where: {
        depositId: deposit.id,
        state: {
          [Op.notIn]: [
            PixDevolutionState.CANCELED,
            PixDevolutionState.FAILED,
            PixDevolutionState.ERROR,
          ],
        },
      },
      transaction: this.transaction,
    });
  }

  async getTotalDevolutionAmountByDeposit(
    deposit: PixDeposit,
  ): Promise<number> {
    return PixDevolutionModel.sum('amount', {
      where: {
        depositId: deposit.id,
        state: {
          [Op.notIn]: [
            PixDevolutionState.CANCELED,
            PixDevolutionState.FAILED,
            PixDevolutionState.ERROR,
          ],
        },
      },
      transaction: this.transaction,
    });
  }

  async getAllByState(state: PixDevolutionState): Promise<PixDevolution[]> {
    return PixDevolutionModel.findAll<PixDevolutionModel>({
      where: {
        state,
      },
      transaction: this.transaction,
    }).then((data) => data.map(PixDevolutionDatabaseRepository.toDomain));
  }

  async getByOperationAndWallet(
    operation: Operation,
    wallet: Wallet,
  ): Promise<PixDevolution> {
    return PixDevolutionModel.findOne<PixDevolutionModel>({
      where: {
        operationId: operation.id,
        walletId: wallet.uuid,
      },
      transaction: this.transaction,
    }).then(PixDevolutionDatabaseRepository.toDomain);
  }

  async getByOperation(operation: Operation): Promise<PixDevolution> {
    return PixDevolutionModel.findOne<PixDevolutionModel>({
      where: {
        operationId: operation.id,
      },
      transaction: this.transaction,
    }).then(PixDevolutionDatabaseRepository.toDomain);
  }

  async getAll(
    pagination: Pagination,
    user?: User,
    wallet?: Wallet,
    createdAtPeriodStart?: Date,
    createdAtPeriodEnd?: Date,
    endToEndId?: string,
    clientDocument?: string,
    states?: PixDevolutionState[],
  ): Promise<TPaginationResponse<PixDevolution>> {
    const where = {
      ...(user?.uuid && { userId: user.uuid }),
      ...(wallet?.uuid && { walletId: wallet.uuid }),
      ...(endToEndId && { endToEndId }),
      ...(clientDocument && { deposit: { clientDocument } }),
      ...(states && { state: { [Op.in]: states } }),
      ...(createdAtPeriodStart && {
        createdAt: {
          [Op.gte]: getMoment(createdAtPeriodStart)
            .startOf('day')
            .toISOString(),
        },
      }),
      ...(createdAtPeriodEnd && {
        createdAt: {
          [Op.lte]: getMoment(createdAtPeriodEnd).endOf('day').toISOString(),
        },
      }),
      ...(createdAtPeriodStart &&
        createdAtPeriodEnd && {
          createdAt: {
            [Op.between]: [
              getMoment(createdAtPeriodStart).startOf('day').toISOString(),
              getMoment(createdAtPeriodEnd).endOf('day').toISOString(),
            ],
          },
        }),
    };

    return PixDevolutionModel.findAndCountAll<PixDevolutionModel>({
      where,
      ...paginationWhere(pagination),
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(PixDevolutionDatabaseRepository.toDomain),
      ),
    );
  }

  async getAllWithDeposit(
    pagination: Pagination,
    user?: User,
    wallet?: Wallet,
    createdAtPeriodStart?: Date,
    createdAtPeriodEnd?: Date,
    endToEndId?: string,
    clientDocument?: string,
    states?: PixDevolutionState[],
  ): Promise<TPaginationResponse<PixDevolution>> {
    const where = {
      ...(user?.uuid && { userId: user.uuid }),
      ...(wallet?.uuid && { walletId: wallet.uuid }),
      ...(endToEndId && { endToEndId }),
      ...(clientDocument && { deposit: { clientDocument } }),
      ...(states && { state: { [Op.in]: states } }),
      ...(createdAtPeriodStart && {
        createdAt: {
          [Op.gte]: getMoment(createdAtPeriodStart)
            .startOf('day')
            .toISOString(),
        },
      }),
      ...(createdAtPeriodEnd && {
        createdAt: {
          [Op.lte]: getMoment(createdAtPeriodEnd).endOf('day').toISOString(),
        },
      }),
      ...(createdAtPeriodStart &&
        createdAtPeriodEnd && {
          createdAt: {
            [Op.between]: [
              getMoment(createdAtPeriodStart).startOf('day').toISOString(),
              getMoment(createdAtPeriodEnd).endOf('day').toISOString(),
            ],
          },
        }),
    };

    return PixDevolutionModel.findAndCountAll<PixDevolutionModel>({
      where,
      ...paginationWhere(pagination),
      include: { model: PixDepositModel },
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(PixDevolutionDatabaseRepository.toDomain),
      ),
    );
  }

  async getWithDepositById(id: string): Promise<PixDevolution> {
    return PixDevolutionModel.findOne<PixDevolutionModel>({
      where: {
        id,
      },
      include: { model: PixDepositModel },
      transaction: this.transaction,
    }).then(PixDevolutionDatabaseRepository.toDomain);
  }

  async getWithDepositByIdAndWallet(
    id: string,
    wallet: Wallet,
  ): Promise<PixDevolution> {
    return PixDevolutionModel.findOne<PixDevolutionModel>({
      where: {
        id,
        walletId: wallet.uuid,
      },
      include: { model: PixDepositModel },
      transaction: this.transaction,
    }).then(PixDevolutionDatabaseRepository.toDomain);
  }

  async getAllByStateAndThresholdDate(
    state: PixDevolutionState,
    date: Date,
    comparisonType: ThresholdDateComparisonType,
  ): Promise<PixDevolution[]> {
    const updatedAt =
      comparisonType === ThresholdDateComparisonType.BEFORE_THAN
        ? {
            [Op.lt]: date,
          }
        : {
            [Op.gte]: date,
          };

    return PixDevolutionModel.findAll<PixDevolutionModel>({
      where: {
        state,
        updatedAt,
      },
      transaction: this.transaction,
    }).then((data) => data.map(PixDevolutionDatabaseRepository.toDomain));
  }
}
