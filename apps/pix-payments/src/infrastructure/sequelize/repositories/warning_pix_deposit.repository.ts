import { Op, Transaction } from 'sequelize';
import {
  DatabaseRepository,
  Pagination,
  TPaginationResponse,
  paginationToDomain,
  paginationWhere,
  getMoment,
} from '@zro/common';
import { User } from '@zro/users/domain';
import { Operation } from '@zro/operations/domain';
import {
  WarningPixDeposit,
  WarningPixDepositRepository,
} from '@zro/pix-payments/domain';
import { WarningPixDepositModel } from '@zro/pix-payments/infrastructure';

export class WarningPixDepositDatabaseRepository
  extends DatabaseRepository
  implements WarningPixDepositRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(model: WarningPixDepositModel): WarningPixDeposit {
    return model?.toDomain() ?? null;
  }

  async create(
    warningPixDeposit: WarningPixDeposit,
  ): Promise<WarningPixDeposit> {
    const createdWarningPixDeposit =
      await WarningPixDepositModel.create<WarningPixDepositModel>(
        warningPixDeposit,
        {
          transaction: this.transaction,
        },
      );

    warningPixDeposit.id = createdWarningPixDeposit.id;
    warningPixDeposit.createdAt = createdWarningPixDeposit.createdAt;

    return warningPixDeposit;
  }

  async update(
    warningPixDeposit: WarningPixDeposit,
  ): Promise<WarningPixDeposit> {
    await WarningPixDepositModel.update<WarningPixDepositModel>(
      warningPixDeposit,
      {
        where: { id: warningPixDeposit.id },
        transaction: this.transaction,
      },
    );

    return warningPixDeposit;
  }

  async getById(id: string): Promise<WarningPixDeposit> {
    return WarningPixDepositModel.findOne<WarningPixDepositModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(WarningPixDepositDatabaseRepository.toDomain);
  }

  async getAll(
    pagination: Pagination,
    user?: User,
    transactionTag?: string,
    operationId?: string,
    createdAtPeriodStart?: Date,
    createdAtPeriodEnd?: Date,
    updatedAtPeriodStart?: Date,
    updatedAtPeriodEnd?: Date,
  ): Promise<TPaginationResponse<WarningPixDeposit>> {
    return WarningPixDepositModel.findAndCountAll<WarningPixDepositModel>({
      where: {
        ...(user?.uuid && { userId: user.uuid }),
        ...(transactionTag && { transactionTag }),
        ...(operationId && { operationId }),
        ...(createdAtPeriodStart &&
          createdAtPeriodEnd && {
            createdAt: {
              [Op.between]: [
                getMoment(createdAtPeriodStart).startOf('day').toISOString(),
                getMoment(createdAtPeriodEnd).endOf('day').toISOString(),
              ],
            },
          }),
        ...(updatedAtPeriodStart &&
          updatedAtPeriodEnd && {
            updatedAt: {
              [Op.between]: [
                getMoment(updatedAtPeriodStart).startOf('day').toISOString(),
                getMoment(updatedAtPeriodEnd).endOf('day').toISOString(),
              ],
            },
          }),
      },
      ...paginationWhere(pagination),
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(WarningPixDepositDatabaseRepository.toDomain),
      ),
    );
  }

  async getByOperation(operation: Operation): Promise<WarningPixDeposit> {
    return WarningPixDepositModel.findOne<WarningPixDepositModel>({
      where: {
        operationId: operation.id,
      },
      transaction: this.transaction,
    }).then(WarningPixDepositDatabaseRepository.toDomain);
  }
}
