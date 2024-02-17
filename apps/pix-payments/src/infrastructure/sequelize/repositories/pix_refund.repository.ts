import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import {
  PixInfraction,
  PixRefund,
  PixRefundDevolution,
  PixRefundRepository,
} from '@zro/pix-payments/domain';
import { PixRefundModel } from '@zro/pix-payments/infrastructure';

export class PixRefundDatabaseRepository
  extends DatabaseRepository
  implements PixRefundRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(refundRequestModel: PixRefundModel): PixRefund {
    return refundRequestModel?.toDomain() ?? null;
  }

  async create(refund: PixRefund): Promise<PixRefund> {
    const refundGenerated = await PixRefundModel.create<PixRefundModel>(
      refund,
      {
        transaction: this.transaction,
      },
    );

    refund.createdAt = refundGenerated.createdAt;
    return refund;
  }

  async getById(id: string): Promise<PixRefund> {
    return PixRefundModel.findOne<PixRefundModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(PixRefundDatabaseRepository.toDomain);
  }

  async getByIssueId(issueId: number): Promise<PixRefund> {
    return PixRefundModel.findOne<PixRefundModel>({
      where: {
        issueId,
      },
      transaction: this.transaction,
    }).then(PixRefundDatabaseRepository.toDomain);
  }

  async update(refund: PixRefund): Promise<PixRefund> {
    await PixRefundModel.update<PixRefundModel>(refund, {
      where: { id: refund.id },
      transaction: this.transaction,
    });

    return refund;
  }

  async getByInfraction(infraction: PixInfraction): Promise<PixRefund> {
    return PixRefundModel.findOne<PixRefundModel>({
      where: {
        infractionId: infraction.id,
      },
      transaction: this.transaction,
    }).then(PixRefundDatabaseRepository.toDomain);
  }

  async getByRefundDevolution(
    refundDevolution: PixRefundDevolution,
  ): Promise<PixRefund> {
    return PixRefundModel.findOne<PixRefundModel>({
      where: {
        refundDevolutionId: refundDevolution.id,
      },
      transaction: this.transaction,
    }).then(PixRefundDatabaseRepository.toDomain);
  }

  async getBySolicitationId(solicitationPspId: string): Promise<PixRefund> {
    return PixRefundModel.findOne<PixRefundModel>({
      where: {
        solicitationPspId,
      },
      transaction: this.transaction,
    }).then(PixRefundDatabaseRepository.toDomain);
  }
}
