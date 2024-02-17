import { Transaction, Op } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import {
  PixRefundDevolution,
  PixRefundDevolutionRepository,
  PixRefundDevolutionState,
  ThresholdDateComparisonType,
} from '@zro/pix-payments/domain';
import { PixRefundDevolutionModel } from '@zro/pix-payments/infrastructure';

export class PixRefundDevolutionDatabaseRepository
  extends DatabaseRepository
  implements PixRefundDevolutionRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(
    devolutionModel: PixRefundDevolutionModel,
  ): PixRefundDevolution {
    return devolutionModel?.toDomain() ?? null;
  }

  async create(devolution: PixRefundDevolution): Promise<PixRefundDevolution> {
    const devolutionGenerated =
      await PixRefundDevolutionModel.create<PixRefundDevolutionModel>(
        devolution,
        {
          transaction: this.transaction,
        },
      );

    devolution.createdAt = devolutionGenerated.createdAt;
    devolution.updatedAt = devolutionGenerated.updatedAt;
    return devolution;
  }

  async update(devolution: PixRefundDevolution): Promise<PixRefundDevolution> {
    await PixRefundDevolutionModel.update<PixRefundDevolutionModel>(
      devolution,
      {
        where: { id: devolution.id },
        transaction: this.transaction,
      },
    );

    return devolution;
  }

  async getById(id: string): Promise<PixRefundDevolution> {
    return PixRefundDevolutionModel.findOne<PixRefundDevolutionModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(PixRefundDevolutionDatabaseRepository.toDomain);
  }

  async getAllByState(
    state: PixRefundDevolutionState,
  ): Promise<PixRefundDevolution[]> {
    return PixRefundDevolutionModel.findAll<PixRefundDevolutionModel>({
      where: {
        state,
      },
      transaction: this.transaction,
    }).then((data) => data.map(PixRefundDevolutionDatabaseRepository.toDomain));
  }

  async countByTransaction(transactionId): Promise<number> {
    return PixRefundDevolutionModel.count<PixRefundDevolutionModel>({
      where: {
        transactionId,
        state: {
          [Op.notIn]: [
            PixRefundDevolutionState.CANCELED,
            PixRefundDevolutionState.FAILED,
            PixRefundDevolutionState.ERROR,
          ],
        },
      },
      transaction: this.transaction,
    });
  }

  async getAllByStateAndThresholdDate(
    state: PixRefundDevolutionState,
    date: Date,
    comparisonType: ThresholdDateComparisonType,
  ): Promise<PixRefundDevolution[]> {
    const updatedAt =
      comparisonType === ThresholdDateComparisonType.BEFORE_THAN
        ? {
            [Op.lt]: date,
          }
        : {
            [Op.gte]: date,
          };

    return PixRefundDevolutionModel.findAll<PixRefundDevolutionModel>({
      where: {
        state,
        updatedAt,
      },
      transaction: this.transaction,
    }).then((data) => data.map(PixRefundDevolutionDatabaseRepository.toDomain));
  }
}
