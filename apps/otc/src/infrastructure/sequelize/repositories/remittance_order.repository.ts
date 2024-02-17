import {
  DatabaseRepository,
  getMoment,
  Pagination,
  paginationToDomain,
  paginationWhere,
  TPaginationResponse,
} from '@zro/common';
import {
  RemittanceOrder,
  RemittanceOrderRepository,
  RemittanceOrderStatus,
  TGetRemittanceOrdersFilter,
} from '@zro/otc/domain';
import { RemittanceOrderModel } from '@zro/otc/infrastructure';
import { Op } from 'sequelize';

export class RemittanceOrderDatabaseRepository
  extends DatabaseRepository
  implements RemittanceOrderRepository
{
  static toDomain(model: RemittanceOrderModel): RemittanceOrder {
    return model?.toDomain() ?? null;
  }

  /**
   * Create a remittance order.
   *
   * @param remittanceOrder remittance order instance.
   * @returns created remittance order.
   */
  async create(remittanceOrder: RemittanceOrder): Promise<RemittanceOrder> {
    const createdRemittanceOrder =
      await RemittanceOrderModel.create<RemittanceOrderModel>(remittanceOrder, {
        transaction: this.transaction,
      });

    remittanceOrder.id = createdRemittanceOrder.id;
    remittanceOrder.createdAt = createdRemittanceOrder.createdAt;

    return remittanceOrder;
  }

  /**
   * Update a remittance order.
   *
   * @param remittanceOrder remittance order instance.
   * @returns updated remittance order.
   */
  async update(remittanceOrder: RemittanceOrder): Promise<RemittanceOrder> {
    await RemittanceOrderModel.update<RemittanceOrderModel>(remittanceOrder, {
      where: { id: remittanceOrder.id },
      transaction: this.transaction,
    });

    return remittanceOrder;
  }

  /**
   * Get a remittance order by ID.
   *
   * @param id remittance order ID.
   * @returns found remittance order.
   */
  async getById(id: string): Promise<RemittanceOrder> {
    return RemittanceOrderModel.findOne<RemittanceOrderModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(RemittanceOrderDatabaseRepository.toDomain);
  }

  /**
   * Get all remittance orders by status.
   *
   * @param pagination pagination.
   * @param status Remittance Order status.
   * @returns found remittance orders.
   */
  async getAllByStatus(
    pagination: Pagination,
    status: RemittanceOrderStatus,
  ): Promise<TPaginationResponse<RemittanceOrder>> {
    return RemittanceOrderModel.findAndCountAll<RemittanceOrderModel>({
      ...paginationWhere(pagination),
      where: {
        status,
      },
      order: [['created_at', 'asc']],
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(RemittanceOrderDatabaseRepository.toDomain),
      ),
    );
  }

  /**
   * Get a Remittance Order Remittance by Remittance.
   *
   * @param pagination pagination.
   * @param filter filter.
   * @returns Remittance Orders found.
   */
  async getAllByFilter(
    pagination: Pagination,
    filter: TGetRemittanceOrdersFilter,
  ): Promise<TPaginationResponse<RemittanceOrder>> {
    const {
      side,
      currencyId,
      amountStart,
      amountEnd,
      status,
      systemId,
      providerId,
      type,
      createdAtStart,
      createdAtEnd,
      updatedAtStart,
      updatedAtEnd,
    } = filter;

    const where = {
      ...(createdAtStart &&
        createdAtEnd && {
          createdAt: {
            [Op.between]: [
              getMoment(createdAtStart).startOf('day').toISOString(),
              getMoment(createdAtEnd).endOf('day').toISOString(),
            ],
          },
        }),
      ...(updatedAtStart &&
        updatedAtEnd && {
          updatedAt: {
            [Op.between]: [
              getMoment(updatedAtStart).startOf('day').toISOString(),
              getMoment(updatedAtEnd).endOf('day').toISOString(),
            ],
          },
        }),
      ...(amountStart &&
        amountEnd && {
          amount: {
            [Op.between]: [amountStart, amountEnd],
          },
        }),
      ...(side && {
        side: side,
      }),
      ...(currencyId && {
        currencyId: currencyId,
      }),
      ...(status && {
        status: status,
      }),
      ...(systemId && {
        systemId: systemId,
      }),
      ...(providerId && {
        providerId: providerId,
      }),
      ...(type && {
        type: type,
      }),
    };

    return RemittanceOrderModel.findAndCountAll<RemittanceOrderModel>({
      ...paginationWhere(pagination),
      where,
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(RemittanceOrderDatabaseRepository.toDomain),
      ),
    );
  }
}
