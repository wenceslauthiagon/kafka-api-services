import {
  DatabaseRepository,
  Pagination,
  TPaginationResponse,
  paginationToDomain,
  paginationWhere,
  getMoment,
} from '@zro/common';
import {
  Remittance,
  RemittanceOrder,
  RemittanceOrderRemittance,
  RemittanceOrderRemittanceRepository,
  TGetRemittanceOrdersFilter,
} from '@zro/otc/domain';
import {
  RemittanceModel,
  RemittanceOrderModel,
  RemittanceOrderRemittanceModel,
} from '@zro/otc/infrastructure';
import { Op } from 'sequelize';

export class RemittanceOrderRemittanceDatabaseRepository
  extends DatabaseRepository
  implements RemittanceOrderRemittanceRepository
{
  static toDomain(
    model: RemittanceOrderRemittanceModel,
  ): RemittanceOrderRemittance {
    return model?.toDomain() ?? null;
  }

  /**
   * Create a new Remittance Order Remittance Remittance.
   *
   * @param remittanceOrderRemittance Remittance Order Remittance Remittance instance.
   * @returns created Remittance Order Remittance Remittance.
   */
  async create(
    remittanceOrderRemittance: RemittanceOrderRemittance,
  ): Promise<RemittanceOrderRemittance> {
    const createdRemittanceOrderRemittance =
      await RemittanceOrderRemittanceModel.create<RemittanceOrderRemittanceModel>(
        remittanceOrderRemittance,
        {
          transaction: this.transaction,
        },
      );

    remittanceOrderRemittance.id = createdRemittanceOrderRemittance.id;
    remittanceOrderRemittance.createdAt =
      createdRemittanceOrderRemittance.createdAt;

    return remittanceOrderRemittance;
  }

  /**
   * Update a Remittance Order Remittance.
   *
   * @param remittanceOrderRemittance Remittance Order Remittance instance.
   * @returns updated Remittance Order Remittance.
   */
  async update(
    remittanceOrderRemittance: RemittanceOrderRemittance,
  ): Promise<RemittanceOrderRemittance> {
    await RemittanceOrderRemittanceModel.update<RemittanceOrderRemittanceModel>(
      remittanceOrderRemittance,
      {
        where: { id: remittanceOrderRemittance.id },
        transaction: this.transaction,
      },
    );

    return remittanceOrderRemittance;
  }

  /**
   * Get a Remittance Order Remittance by ID.
   *
   * @param id Remittance Order Remittance ID.
   * @returns Remittance Order Remittance found.
   */
  async getById(id: string): Promise<RemittanceOrderRemittance> {
    return RemittanceOrderRemittanceModel.findOne<RemittanceOrderRemittanceModel>(
      {
        where: {
          id,
        },
        transaction: this.transaction,
      },
    ).then(RemittanceOrderRemittanceDatabaseRepository.toDomain);
  }

  /**
   * Get a Remittance Order Remittance by Remittance.
   *
   * @param remittance Remittance.
   * @returns Remittance Order Remittances found.
   */
  async getAllByRemittance(
    remittance: Remittance,
  ): Promise<RemittanceOrderRemittance[]> {
    return RemittanceOrderRemittanceModel.findAll<RemittanceOrderRemittanceModel>(
      {
        where: {
          remittanceId: remittance.id,
        },
        transaction: this.transaction,
      },
    ).then((data) =>
      data.map(RemittanceOrderRemittanceDatabaseRepository.toDomain),
    );
  }

  /**
   * Get a Remittance Order Remittance by Remittance.
   *
   * @param pagination pagination.
   * @param filter filter.
   * @returns Remittance Order Remittances found.
   */
  async getAllByFilter(
    pagination: Pagination,
    filter: TGetRemittanceOrdersFilter,
  ): Promise<TPaginationResponse<RemittanceOrderRemittance>> {
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
      remittanceStatus,
      remittanceId,
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

    const include = [
      {
        model: RemittanceOrderModel,
        required: true,
        where,
      },
      {
        model: RemittanceModel,
        required: true,
        where: { ...(remittanceStatus && { status: remittanceStatus }) },
      },
    ];

    return RemittanceOrderRemittanceModel.findAndCountAll<RemittanceOrderRemittanceModel>(
      {
        ...paginationWhere(pagination),
        where: {
          ...(remittanceId && { remittanceId }),
        },
        include,
        transaction: this.transaction,
        distinct: true,
      },
    ).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(RemittanceOrderRemittanceDatabaseRepository.toDomain),
      ),
    );
  }

  /**
   * Get a Remittance Order Remittance by Remittance Order.
   *
   * @param remittanceOrder RemittanceOrder.
   * @returns Remittance Order Remittances found.
   */
  async getAllByRemittanceOrder(
    remittanceOrder: RemittanceOrder,
  ): Promise<RemittanceOrderRemittance[]> {
    return RemittanceOrderRemittanceModel.findAll<RemittanceOrderRemittanceModel>(
      {
        where: {
          remittanceOrderId: remittanceOrder.id,
        },
        include: {
          model: RemittanceModel,
          required: false,
        },
        transaction: this.transaction,
      },
    ).then((data) =>
      data.map(RemittanceOrderRemittanceDatabaseRepository.toDomain),
    );
  }
}
