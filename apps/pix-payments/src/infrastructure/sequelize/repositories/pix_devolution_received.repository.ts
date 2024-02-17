import { Op } from 'sequelize';
import {
  DatabaseRepository,
  Pagination,
  paginationToDomain,
  paginationWhere,
  TPaginationResponse,
  getMoment,
} from '@zro/common';
import { User } from '@zro/users/domain';
import { Operation, Wallet } from '@zro/operations/domain';
import {
  PixDevolutionReceived,
  PixDevolutionReceivedRepository,
  PixDevolutionReceivedState,
} from '@zro/pix-payments/domain';
import { PixDevolutionReceivedModel } from '@zro/pix-payments/infrastructure';

export class PixDevolutionReceivedDatabaseRepository
  extends DatabaseRepository
  implements PixDevolutionReceivedRepository
{
  static toDomain(model: PixDevolutionReceivedModel): PixDevolutionReceived {
    return model?.toDomain() ?? null;
  }

  async create(body: PixDevolutionReceived): Promise<PixDevolutionReceived> {
    const createdBody =
      await PixDevolutionReceivedModel.create<PixDevolutionReceivedModel>(
        body,
        { transaction: this.transaction },
      );

    body.createdAt = createdBody.createdAt;
    return body;
  }

  async update(body: PixDevolutionReceived): Promise<PixDevolutionReceived> {
    await PixDevolutionReceivedModel.update<PixDevolutionReceivedModel>(body, {
      where: { id: body.id },
      transaction: this.transaction,
    });

    return body;
  }

  async getById(id: string): Promise<PixDevolutionReceived> {
    return PixDevolutionReceivedModel.findOne<PixDevolutionReceivedModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(PixDevolutionReceivedDatabaseRepository.toDomain);
  }

  async getByIdAndWallet(
    id: string,
    wallet: Wallet,
  ): Promise<PixDevolutionReceived> {
    return PixDevolutionReceivedModel.findOne<PixDevolutionReceivedModel>({
      where: {
        id,
        walletId: wallet.uuid,
      },
      transaction: this.transaction,
    }).then(PixDevolutionReceivedDatabaseRepository.toDomain);
  }

  async getByOperationAndWallet(
    operation: Operation,
    wallet: Wallet,
  ): Promise<PixDevolutionReceived> {
    return PixDevolutionReceivedModel.findOne<PixDevolutionReceivedModel>({
      where: {
        operationId: operation.id,
        walletId: wallet.uuid,
      },
      transaction: this.transaction,
    }).then(PixDevolutionReceivedDatabaseRepository.toDomain);
  }

  async getByOperation(operation: Operation): Promise<PixDevolutionReceived> {
    return PixDevolutionReceivedModel.findOne<PixDevolutionReceivedModel>({
      where: {
        operationId: operation.id,
      },
      transaction: this.transaction,
    }).then(PixDevolutionReceivedDatabaseRepository.toDomain);
  }

  async getByEndToEndId(endToEndId: string): Promise<PixDevolutionReceived> {
    return PixDevolutionReceivedModel.findOne<PixDevolutionReceivedModel>({
      where: {
        endToEndId,
      },
      transaction: this.transaction,
    }).then(PixDevolutionReceivedDatabaseRepository.toDomain);
  }

  async getByIdOrEndToEndId(
    id: string,
    endToEndId: string,
  ): Promise<PixDevolutionReceived> {
    return PixDevolutionReceivedModel.findOne<PixDevolutionReceivedModel>({
      where: {
        ...(id ? { id } : { endToEndId }),
      },
      transaction: this.transaction,
    }).then(PixDevolutionReceivedDatabaseRepository.toDomain);
  }

  async getAll(
    pagination: Pagination,
    user?: User,
    wallet?: Wallet,
    createdAtPeriodStart?: Date,
    createdAtPeriodEnd?: Date,
    endToEndId?: string,
    clientDocument?: string,
    states?: PixDevolutionReceivedState[],
  ): Promise<TPaginationResponse<PixDevolutionReceived>> {
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

    return PixDevolutionReceivedModel.findAndCountAll<PixDevolutionReceivedModel>(
      {
        where,
        ...paginationWhere(pagination),
        transaction: this.transaction,
      },
    ).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(PixDevolutionReceivedDatabaseRepository.toDomain),
      ),
    );
  }
}
