import { Op } from 'sequelize';
import {
  DatabaseRepository,
  Pagination,
  paginationToDomain,
  paginationWhere,
  TPaginationResponse,
  getMoment,
} from '@zro/common';
import { isDefined } from 'class-validator';
import {
  Remittance,
  RemittanceRepository,
  RemittanceStatus,
  GetAllRemittanceFilter,
} from '@zro/otc/domain';
import {
  RemittanceModel,
  RemittanceOrderRemittanceModel,
} from '@zro/otc/infrastructure';

export class RemittanceDatabaseRepository
  extends DatabaseRepository
  implements RemittanceRepository
{
  static toDomain(model: RemittanceModel): Remittance {
    return model?.toDomain() ?? null;
  }

  async create(remittance: Remittance): Promise<Remittance> {
    const createdRemittance = await RemittanceModel.create<RemittanceModel>(
      remittance,
      { transaction: this.transaction },
    );

    remittance.id = createdRemittance.id;
    remittance.createdAt = createdRemittance.createdAt;

    return remittance;
  }

  async update(remittance: Remittance): Promise<Remittance> {
    await RemittanceModel.update<RemittanceModel>(remittance, {
      where: { id: remittance.id },
      transaction: this.transaction,
    });

    return remittance;
  }

  async getById(id: string): Promise<Remittance> {
    return RemittanceModel.findOne<RemittanceModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(RemittanceDatabaseRepository.toDomain);
  }

  /**
   * Get all remittances by status.
   *
   * @param pagination Pagination.
   * @param status Remittance status.
   * @returns Found remittances.
   */
  async getAllByStatus(
    pagination: Pagination,
    status: RemittanceStatus,
  ): Promise<TPaginationResponse<Remittance>> {
    return RemittanceModel.findAndCountAll<RemittanceModel>({
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
        data.rows.map(RemittanceDatabaseRepository.toDomain),
      ),
    );
  }

  /**
   * Get all remittances by filter.
   *
   * @param pagination Pagination.
   * @param filter filter.
   * @returns Found remittances.
   */
  async getAllByFilter(
    pagination: Pagination,
    filter: GetAllRemittanceFilter,
  ): Promise<TPaginationResponse<Remittance>> {
    const {
      orderId,
      providerId,
      contractId,
      status,
      amountStart,
      amountEnd,
      bankQuoteStart,
      bankQuoteEnd,
      createdAtStart,
      createdAtEnd,
      updatedAtStart,
      updatedAtEnd,
      isConcomitant,
      resultAmountStart,
      resultAmountEnd,
      side,
      systemId,
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
      ...(bankQuoteStart &&
        bankQuoteEnd && {
          bankQuote: {
            [Op.between]: [bankQuoteStart, bankQuoteEnd],
          },
        }),
      ...(resultAmountStart &&
        resultAmountEnd && {
          resultAmount: {
            [Op.between]: [resultAmountStart, resultAmountEnd],
          },
        }),
      ...(side && { side }),
      ...(isDefined(isConcomitant) && { isConcomitant }),
      ...(status && { status }),
      ...(systemId && { systemId }),
      ...(providerId && { providerId }),
      ...(contractId && { exchangeContractId: contractId }),
    };

    const whereRemittanceOrder = orderId && { remittanceOrderId: orderId };

    const include = [];

    if (orderId) {
      include.push({
        model: RemittanceOrderRemittanceModel,
        where: whereRemittanceOrder,
      });
    }

    return RemittanceModel.findAndCountAll<RemittanceModel>({
      ...paginationWhere(pagination),
      where,
      include,
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(RemittanceDatabaseRepository.toDomain),
      ),
    );
  }
}
