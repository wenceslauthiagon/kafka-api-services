import { Op, Transaction } from 'sequelize';
import {
  DatabaseRepository,
  Pagination,
  TPaginationResponse,
  paginationToDomain,
  paginationWhere,
  getMoment,
} from '@zro/common';
import {
  BotOtc,
  BotOtcOrder,
  BotOtcOrderRepository,
  BotOtcOrderState,
  TGetBotOtcOrderFilter,
  TGetBotOtcOrdersFilter,
} from '@zro/otc-bot/domain';
import { BotOtcOrderModel } from '@zro/otc-bot/infrastructure';
import { CryptoOrder } from '@zro/otc/domain';

export class BotOtcOrderDatabaseRepository
  extends DatabaseRepository
  implements BotOtcOrderRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(botOtcOrder: BotOtcOrderModel): BotOtcOrder {
    return botOtcOrder?.toDomain() ?? null;
  }

  async create(botOtcOrder: BotOtcOrder): Promise<BotOtcOrder> {
    return BotOtcOrderModel.create(botOtcOrder, {
      transaction: this.transaction,
    }).then(BotOtcOrderDatabaseRepository.toDomain);
  }

  async update(botOtcOrder: BotOtcOrder): Promise<BotOtcOrder> {
    await BotOtcOrderModel.update(botOtcOrder, {
      where: { id: botOtcOrder.id },
      transaction: this.transaction,
    });

    return botOtcOrder;
  }

  async delete(botOtcOrder: BotOtcOrder): Promise<void> {
    await BotOtcOrderModel.destroy({
      where: { id: botOtcOrder.id },
      transaction: this.transaction,
    });
  }

  async getById(id: string): Promise<BotOtcOrder> {
    return BotOtcOrderModel.findOne<BotOtcOrderModel>({
      where: { id },
      transaction: this.transaction,
    }).then(BotOtcOrderDatabaseRepository.toDomain);
  }

  async getAll(): Promise<BotOtcOrder[]> {
    return BotOtcOrderModel.findAll<BotOtcOrderModel>({
      transaction: this.transaction,
    }).then((bots) => bots.map(BotOtcOrderDatabaseRepository.toDomain));
  }

  async getAllByBotOtcAndStateIn(
    bot: BotOtc,
    states: BotOtcOrderState[],
  ): Promise<BotOtcOrder[]> {
    return BotOtcOrderModel.findAll<BotOtcOrderModel>({
      where: {
        botOtcId: bot.id,
        state: { [Op.in]: states },
      },
      transaction: this.transaction,
    }).then((bots) => bots.map(BotOtcOrderDatabaseRepository.toDomain));
  }

  async getAllByStateInAndCreatedAtBefore(
    states: BotOtcOrderState[],
    createdAt: Date,
  ): Promise<BotOtcOrder[]> {
    return BotOtcOrderModel.findAll<BotOtcOrderModel>({
      where: {
        state: { [Op.in]: states },
        createdAt: { [Op.lte]: createdAt },
      },
      transaction: this.transaction,
    }).then((bots) => bots.map(BotOtcOrderDatabaseRepository.toDomain));
  }

  /**
   * Get all bot otc orders by states in.
   *
   * @param pagination Pagination.
   * @param states Bot otc order states.
   * @returns Found remittances.
   */
  async getAllByPaginationAndStateIn(
    pagination: Pagination,
    states: BotOtcOrderState[],
  ): Promise<TPaginationResponse<BotOtcOrder>> {
    return BotOtcOrderModel.findAndCountAll<BotOtcOrderModel>({
      ...paginationWhere(pagination),
      where: {
        state: { [Op.in]: states },
      },
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(BotOtcOrderDatabaseRepository.toDomain),
      ),
    );
  }

  /**
   * Get a Bot Otc order by crypto order id.
   * @param cryptoOrder Crypto Order.
   * @return BotOtcOrder found.
   */
  async getByBuyCryptoOrder(cryptoOrder: CryptoOrder): Promise<BotOtcOrder> {
    return BotOtcOrderModel.findOne<BotOtcOrderModel>({
      where: { buyOrderId: cryptoOrder.id },
      transaction: this.transaction,
    }).then(BotOtcOrderDatabaseRepository.toDomain);
  }

  /**
   * List all BotOtcOrders by filter and pagination.
   * @param pagination Pagination.
   * @param filter Filter.
   * @return BotOtcOrders found.
   */
  async getAllByFilterAndPagination(
    pagination: Pagination,
    filter: TGetBotOtcOrderFilter,
  ): Promise<TPaginationResponse<BotOtcOrder>> {
    const { botOtcId, state, createdAtStart, createdAtEnd } = filter;

    const where = {
      ...(botOtcId && {
        botOtcId,
      }),
      ...(state && {
        state,
      }),
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

    return BotOtcOrderModel.findAndCountAll<BotOtcOrderModel>({
      ...paginationWhere(pagination),
      where,
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(BotOtcOrderDatabaseRepository.toDomain),
      ),
    );
  }

  /**
   * Get all bot otc orders by filter.
   * @param pagination pagination.
   * @param filter filter.
   * @return BotOtcOrders found.
   */
  async getAllByFilter(
    pagination: Pagination,
    filter: TGetBotOtcOrdersFilter,
  ): Promise<TPaginationResponse<BotOtcOrder>> {
    const {
      state,
      baseCurrencySymbol,
      quoteCurrencySymbol,
      amountStart,
      amountEnd,
      type,
      sellStatus,
      sellProviderName,
      sellExecutedPriceStart,
      sellExecutedPriceEnd,
      sellExecutedAmountStart,
      sellExecutedAmountEnd,
      buyProviderName,
      buyExecutedPriceStart,
      buyExecutedPriceEnd,
      buyExecutedAmountStart,
      buyExecutedAmountEnd,
      createdAtStart,
      createdAtEnd,
      updatedAtStart,
      updatedAtEnd,
      remittanceId,
    } = filter;

    const where = {
      ...(state && {
        state,
      }),
      ...(baseCurrencySymbol && {
        baseCurrencySymbol,
      }),
      ...(quoteCurrencySymbol && {
        quoteCurrencySymbol,
      }),
      ...(amountStart &&
        amountEnd && {
          amount: {
            [Op.between]: [amountStart, amountEnd],
          },
        }),
      ...(type && {
        type,
      }),
      ...(sellStatus && {
        sellStatus,
      }),
      ...(sellProviderName && {
        sellProviderName,
      }),
      ...(sellExecutedPriceStart &&
        sellExecutedPriceEnd && {
          sellExecutedPrice: {
            [Op.between]: [sellExecutedPriceStart, sellExecutedPriceEnd],
          },
        }),
      ...(sellExecutedAmountStart &&
        sellExecutedAmountEnd && {
          sellExecutedAmount: {
            [Op.between]: [sellExecutedAmountStart, sellExecutedAmountEnd],
          },
        }),
      ...(buyProviderName && {
        buyProviderName,
      }),
      ...(buyExecutedPriceStart &&
        buyExecutedPriceEnd && {
          buyExecutedPrice: {
            [Op.between]: [buyExecutedPriceStart, buyExecutedPriceEnd],
          },
        }),
      ...(buyExecutedAmountStart &&
        buyExecutedAmountEnd && {
          buyExecutedAmount: {
            [Op.between]: [buyExecutedAmountStart, buyExecutedAmountEnd],
          },
        }),
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
      ...(remittanceId && {
        buyRemittanceId: remittanceId,
      }),
    };

    return BotOtcOrderModel.findAndCountAll<BotOtcOrderModel>({
      ...paginationWhere(pagination),
      where,
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(BotOtcOrderDatabaseRepository.toDomain),
      ),
    );
  }
}
