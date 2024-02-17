import { Op } from 'sequelize';
import {
  DatabaseRepository,
  Pagination,
  paginationWhere,
  TPaginationResponse,
  paginationToDomain,
  getMoment,
} from '@zro/common';
import {
  ExchangeQuotation,
  ExchangeQuotationRepository,
  ExchangeQuotationState,
  GetExchangeQuotationFilter,
} from '@zro/otc/domain';
import { ExchangeQuotationModel } from '@zro/otc/infrastructure';

export class ExchangeQuotationDatabaseRepository
  extends DatabaseRepository
  implements ExchangeQuotationRepository
{
  static toDomain(model: ExchangeQuotationModel): ExchangeQuotation {
    return model?.toDomain() ?? null;
  }

  async create(
    exchangeQuotation: ExchangeQuotation,
  ): Promise<ExchangeQuotation> {
    const createdExchangeQuotation =
      await ExchangeQuotationModel.create<ExchangeQuotationModel>(
        exchangeQuotation,
        {
          transaction: this.transaction,
        },
      );

    exchangeQuotation.id = createdExchangeQuotation.id;
    exchangeQuotation.createdAt = createdExchangeQuotation.createdAt;
    return exchangeQuotation;
  }

  async update(
    exchangeQuotation: ExchangeQuotation,
  ): Promise<ExchangeQuotation> {
    await ExchangeQuotationModel.update<ExchangeQuotationModel>(
      exchangeQuotation,
      {
        where: { id: exchangeQuotation.id },
        transaction: this.transaction,
      },
    );

    return exchangeQuotation;
  }

  async getById(id: string): Promise<ExchangeQuotation> {
    return ExchangeQuotationModel.findOne<ExchangeQuotationModel>({
      where: { id },
      transaction: this.transaction,
    }).then(ExchangeQuotationDatabaseRepository.toDomain);
  }

  async getBySolicitationId(
    solicitationPspId: string,
  ): Promise<ExchangeQuotation> {
    return ExchangeQuotationModel.findOne<ExchangeQuotationModel>({
      where: { solicitationPspId },
      transaction: this.transaction,
    }).then(ExchangeQuotationDatabaseRepository.toDomain);
  }

  async getAllByStateIn(
    states: ExchangeQuotationState[],
  ): Promise<ExchangeQuotation[]> {
    return ExchangeQuotationModel.findAll({
      where: { state: { [Op.in]: states } },
      transaction: this.transaction,
    }).then((data) => data.map(ExchangeQuotationDatabaseRepository.toDomain));
  }

  async getAll(
    pagination: Pagination,
    filter?: GetExchangeQuotationFilter,
  ): Promise<TPaginationResponse<ExchangeQuotation>> {
    const {
      quotation,
      state,
      gatewayName,
      solicitationPspId,
      createdAtStart,
      createdAtEnd,
    } = filter;

    const whereClause = {
      ...(quotation && { quotation }),
      ...(state && { state }),
      ...(solicitationPspId && { solicitationPspId }),
      ...(gatewayName && { gatewayName }),
      ...(createdAtStart &&
        createdAtEnd && {
          createdAt: {
            [Op.between]: [
              getMoment(createdAtStart).startOf('day').toISOString(),
              getMoment(createdAtEnd).endOf('day').toISOString(),
            ],
          },
        }),
    };

    return ExchangeQuotationModel.findAndCountAll<ExchangeQuotationModel>({
      ...paginationWhere(pagination),
      where: whereClause,
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(ExchangeQuotationDatabaseRepository.toDomain),
      ),
    );
  }
}
