import { DatabaseRepository } from '@zro/common';
import {
  PixInfractionRefundOperation,
  PixInfractionRefundOperationRepository,
  TGetPixInfractionRefundOperationFilter,
} from '@zro/pix-payments/domain';
import { PixInfractionRefundOperationModel } from '@zro/pix-payments/infrastructure';
import { Op } from 'sequelize';

export class PixInfractionRefundOperationDatabaseRepository
  extends DatabaseRepository
  implements PixInfractionRefundOperationRepository
{
  static toDomain(
    pixInfractionRefundOperation: PixInfractionRefundOperationModel,
  ): PixInfractionRefundOperation {
    return pixInfractionRefundOperation?.toDomain() ?? null;
  }

  /**
   * Create PixInfractionRefundOperation.
   *
   * @param pixInfractionRefundOperation New PixInfractionRefundOperation.
   * @returns Created or Updated PixInfractionRefundOperation.
   */
  async create(
    pixInfractionRefundOperation: PixInfractionRefundOperation,
  ): Promise<PixInfractionRefundOperation> {
    const pixInfractionRefundOperationCreated =
      await PixInfractionRefundOperationModel.create<PixInfractionRefundOperationModel>(
        pixInfractionRefundOperation,
        {
          transaction: this.transaction,
        },
      );

    pixInfractionRefundOperation.createdAt =
      pixInfractionRefundOperationCreated.createdAt;
    pixInfractionRefundOperation.updatedAt =
      pixInfractionRefundOperationCreated.updatedAt;

    return pixInfractionRefundOperation;
  }

  /**
   * Update PixInfractionRefundOperation.
   *
   * @param pixInfractionRefundOperation PixInfractionRefundOperation to be updated.
   * @returns Updated PixInfractionRefundOperation.
   */
  async update(
    pixInfractionRefundOperation: PixInfractionRefundOperation,
  ): Promise<PixInfractionRefundOperation> {
    await PixInfractionRefundOperationModel.update<PixInfractionRefundOperationModel>(
      pixInfractionRefundOperation,
      {
        where: { id: pixInfractionRefundOperation.id },
        transaction: this.transaction,
      },
    );

    return pixInfractionRefundOperation;
  }

  /**
   * Get PixInfractionRefundOperation by filter.
   * @param filter Filter.
   * @returns PixInfractionRefundOperation found or null otherwise.
   */
  async getByFilter(
    filter: TGetPixInfractionRefundOperationFilter,
  ): Promise<PixInfractionRefundOperation> {
    const { user, states } = filter;

    const where = {
      ...(user && {
        userId: user.uuid,
      }),
      ...(states && {
        state: {
          [Op.in]: states,
        },
      }),
    };

    return PixInfractionRefundOperationModel.findOne<PixInfractionRefundOperationModel>(
      {
        where,
        transaction: this.transaction,
      },
    ).then(PixInfractionRefundOperationDatabaseRepository.toDomain);
  }

  /**
   * Get PixInfractionRefundOperation by id.
   * @param id PixInfractionRefundOperation id.
   * @returns PixInfractionRefundOperation found or null otherwise.
   */
  async getById(id: string): Promise<PixInfractionRefundOperation> {
    return PixInfractionRefundOperationModel.findOne<PixInfractionRefundOperationModel>(
      {
        where: {
          id,
        },
        transaction: this.transaction,
      },
    ).then(PixInfractionRefundOperationDatabaseRepository.toDomain);
  }

  /**
   * Get PixInfractionRefundOperation by filter.
   * @param pagination Pagination.
   * @param filter Filter.
   * @returns PixInfractionRefundOperations found or null otherwise.
   */
  async getAllByFilter(
    filter: TGetPixInfractionRefundOperationFilter,
  ): Promise<PixInfractionRefundOperation[]> {
    const { user, pixInfraction, pixRefund, states } = filter;

    const where = {
      ...(user && {
        userId: user.uuid,
      }),
      ...(pixInfraction && {
        pixInfractionId: pixInfraction.id,
      }),
      ...(pixRefund && {
        pixRefundId: pixRefund.id,
      }),
      ...(states && {
        state: {
          [Op.in]: states,
        },
      }),
    };

    return PixInfractionRefundOperationModel.findAll<PixInfractionRefundOperationModel>(
      {
        where,
        transaction: this.transaction,
      },
    ).then((data) =>
      data.map(PixInfractionRefundOperationDatabaseRepository.toDomain),
    );
  }
}
