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
  PixDepositRepository,
  PixDepositState,
} from '@zro/pix-payments/domain';
import { PixDepositModel } from '@zro/pix-payments/infrastructure';

export class PixDepositDatabaseRepository
  extends DatabaseRepository
  implements PixDepositRepository
{
  static toDomain(depositModel: PixDepositModel): PixDeposit {
    return depositModel?.toDomain() ?? null;
  }

  async create(deposit: PixDeposit): Promise<PixDeposit> {
    const depositGenerated = await PixDepositModel.create<PixDepositModel>(
      deposit,
      { transaction: this.transaction },
    );

    deposit.createdAt = depositGenerated.createdAt;
    deposit.updatedAt = depositGenerated.updatedAt;
    return deposit;
  }

  async update(deposit: PixDeposit): Promise<PixDeposit> {
    await PixDepositModel.update<PixDepositModel>(deposit, {
      where: { id: deposit.id },
      transaction: this.transaction,
    });

    return deposit;
  }

  async getById(id: string): Promise<PixDeposit> {
    return PixDepositModel.findOne<PixDepositModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(PixDepositDatabaseRepository.toDomain);
  }

  async getByIdAndWallet(id: string, wallet: Wallet): Promise<PixDeposit> {
    return PixDepositModel.findOne<PixDepositModel>({
      where: {
        id,
        walletId: wallet.uuid,
      },
      transaction: this.transaction,
    }).then(PixDepositDatabaseRepository.toDomain);
  }

  async getByOperation(operation: Operation): Promise<PixDeposit> {
    return PixDepositModel.findOne<PixDepositModel>({
      where: {
        operationId: operation.id,
      },
      transaction: this.transaction,
    }).then(PixDepositDatabaseRepository.toDomain);
  }

  async getByOperationAndWallet(
    operation: Operation,
    wallet: Wallet,
  ): Promise<PixDeposit> {
    return PixDepositModel.findOne<PixDepositModel>({
      where: {
        operationId: operation.id,
        walletId: wallet.uuid,
      },
      transaction: this.transaction,
    }).then(PixDepositDatabaseRepository.toDomain);
  }

  async getByEndToEndId(endToEndId: string): Promise<PixDeposit> {
    return PixDepositModel.findOne<PixDepositModel>({
      where: {
        endToEndId,
      },
      transaction: this.transaction,
    }).then(PixDepositDatabaseRepository.toDomain);
  }

  async getByIdOrEndToEndId(
    id: string,
    endToEndId: string,
  ): Promise<PixDeposit> {
    return PixDepositModel.findOne<PixDepositModel>({
      where: {
        ...(id ? { id } : { endToEndId }),
      },
      transaction: this.transaction,
    }).then(PixDepositDatabaseRepository.toDomain);
  }

  async getAll(
    pagination: Pagination,
    user?: User,
    wallet?: Wallet,
    createdAtPeriodStart?: Date,
    createdAtPeriodEnd?: Date,
    endToEndId?: string,
    clientDocument?: string,
    states?: PixDepositState[],
  ): Promise<TPaginationResponse<PixDeposit>> {
    const where = {
      ...(user?.uuid && { userId: user.uuid }),
      ...(wallet?.uuid && { walletId: wallet.uuid }),
      ...(endToEndId && { endToEndId }),
      ...(clientDocument && { clientDocument }),
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

    return PixDepositModel.findAndCountAll<PixDepositModel>({
      where,
      ...paginationWhere(pagination),
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(PixDepositDatabaseRepository.toDomain),
      ),
    );
  }
}
