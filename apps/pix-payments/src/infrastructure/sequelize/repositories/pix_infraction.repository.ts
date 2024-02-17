import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import {
  PixInfraction,
  PixInfractionAnalysisResultType,
  PixInfractionRepository,
  PixInfractionState,
  PixInfractionType,
} from '@zro/pix-payments/domain';
import { PixInfractionModel } from '@zro/pix-payments/infrastructure';

export class PixInfractionDatabaseRepository
  extends DatabaseRepository
  implements PixInfractionRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(infractionModel: PixInfractionModel): PixInfraction {
    return infractionModel?.toDomain() ?? null;
  }

  async create(infraction: PixInfraction): Promise<PixInfraction> {
    const createdInfraction =
      await PixInfractionModel.create<PixInfractionModel>(infraction, {
        transaction: this.transaction,
      });

    infraction.createdAt = createdInfraction.createdAt;
    return infraction;
  }

  async getByInfractionPspId(infractionPspId: string): Promise<PixInfraction> {
    return PixInfractionModel.findOne<PixInfractionModel>({
      where: {
        infractionPspId,
      },
      transaction: this.transaction,
    }).then(PixInfractionDatabaseRepository.toDomain);
  }

  async getById(id: string): Promise<PixInfraction> {
    return PixInfractionModel.findOne<PixInfractionModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(PixInfractionDatabaseRepository.toDomain);
  }

  async update(infraction: PixInfraction): Promise<PixInfraction> {
    await PixInfractionModel.update<PixInfractionModel>(infraction, {
      where: { id: infraction.id },
      transaction: this.transaction,
    });

    return infraction;
  }

  async getByIssueId(issueId: number): Promise<PixInfraction> {
    return PixInfractionModel.findOne<PixInfractionModel>({
      where: {
        issueId,
      },
      transaction: this.transaction,
    }).then(PixInfractionDatabaseRepository.toDomain);
  }

  async getAllTypeIsRequestRefundAndStateIsClosedConfimedAndAnalysisIsAgreed(): Promise<
    PixInfraction[]
  > {
    return PixInfractionModel.findAll<PixInfractionModel>({
      where: {
        infractionType: PixInfractionType.REFUND_REQUEST,
        state: PixInfractionState.CLOSED_CONFIRMED,
        analysisResult: PixInfractionAnalysisResultType.AGREED,
      },
      transaction: this.transaction,
    }).then((res) => res.map(PixInfractionDatabaseRepository.toDomain));
  }
}
