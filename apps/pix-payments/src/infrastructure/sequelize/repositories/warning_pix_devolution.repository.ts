import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import {
  ThresholdDateComparisonType,
  WarningPixDevolution,
  WarningPixDevolutionRepository,
  WarningPixDevolutionState,
} from '@zro/pix-payments/domain';
import { Operation } from '@zro/operations/domain';
import { WarningPixDevolutionModel } from '@zro/pix-payments/infrastructure';
import { Op } from 'sequelize';

export class WarningPixDevolutionDatabaseRepository
  extends DatabaseRepository
  implements WarningPixDevolutionRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(
    warningPixDevolutionModel: WarningPixDevolutionModel,
  ): WarningPixDevolution {
    return warningPixDevolutionModel?.toDomain() ?? null;
  }

  async create(
    warningPixDevolution: WarningPixDevolution,
  ): Promise<WarningPixDevolution> {
    const warningPixDevolutionGenerated =
      await WarningPixDevolutionModel.create<WarningPixDevolutionModel>(
        warningPixDevolution,
        {
          transaction: this.transaction,
        },
      );

    warningPixDevolution.createdAt = warningPixDevolutionGenerated.createdAt;
    warningPixDevolution.updatedAt = warningPixDevolutionGenerated.updatedAt;
    return warningPixDevolution;
  }

  async update(
    devolution: WarningPixDevolution,
  ): Promise<WarningPixDevolution> {
    await WarningPixDevolutionModel.update<WarningPixDevolutionModel>(
      devolution,
      {
        where: { id: devolution.id },
        transaction: this.transaction,
      },
    );

    return devolution;
  }

  async getById(id: string): Promise<WarningPixDevolution> {
    return WarningPixDevolutionModel.findOne<WarningPixDevolutionModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(WarningPixDevolutionDatabaseRepository.toDomain);
  }

  async getByOperation(operation: Operation): Promise<WarningPixDevolution> {
    return WarningPixDevolutionModel.findOne<WarningPixDevolutionModel>({
      where: {
        operationId: operation.id,
      },
      transaction: this.transaction,
    }).then(WarningPixDevolutionDatabaseRepository.toDomain);
  }

  async getAllByState(
    state: WarningPixDevolutionState,
  ): Promise<WarningPixDevolution[]> {
    return WarningPixDevolutionModel.findAll<WarningPixDevolutionModel>({
      where: {
        state,
      },
      transaction: this.transaction,
    }).then((data) =>
      data.map(WarningPixDevolutionDatabaseRepository.toDomain),
    );
  }

  async getAllByStateAndThresholdDate(
    state: WarningPixDevolutionState,
    date: Date,
    comparisonType: ThresholdDateComparisonType,
  ): Promise<WarningPixDevolution[]> {
    const updatedAt =
      comparisonType === ThresholdDateComparisonType.BEFORE_THAN
        ? {
            [Op.lt]: date,
          }
        : {
            [Op.gte]: date,
          };

    return WarningPixDevolutionModel.findAll<WarningPixDevolutionModel>({
      where: {
        state,
        updatedAt,
      },
      transaction: this.transaction,
    }).then((data) =>
      data.map(WarningPixDevolutionDatabaseRepository.toDomain),
    );
  }
}
