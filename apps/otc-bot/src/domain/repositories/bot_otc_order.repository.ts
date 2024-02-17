import { Pagination, TPaginationResponse } from '@zro/common';
import { BotOtc, BotOtcOrder, BotOtcOrderState } from '@zro/otc-bot/domain';
import {
  CryptoOrder,
  CryptoRemittanceStatus,
  OrderType,
} from '@zro/otc/domain';

export enum BotOtcOrderRequestSort {
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
}

export type TGetBotOtcOrderFilter = {
  botOtcId?: string;
  createdAtStart?: Date;
  createdAtEnd?: Date;
  state?: BotOtcOrderState;
};

export type TGetBotOtcOrdersFilter = {
  state?: BotOtcOrderState;
  baseCurrencySymbol?: string;
  quoteCurrencySymbol?: string;
  amountStart?: number;
  amountEnd?: number;
  type?: OrderType;
  sellStatus?: CryptoRemittanceStatus;
  sellProviderName?: string;
  sellExecutedPriceStart?: number;
  sellExecutedPriceEnd?: number;
  sellExecutedAmountStart?: number;
  sellExecutedAmountEnd?: number;
  buyProviderName?: string;
  buyExecutedPriceStart?: number;
  buyExecutedPriceEnd?: number;
  buyExecutedAmountStart?: number;
  buyExecutedAmountEnd?: number;
  createdAtStart?: Date;
  createdAtEnd?: Date;
  updatedAtStart?: Date;
  updatedAtEnd?: Date;
  remittanceId?: string;
};

export interface BotOtcOrderRepository {
  create(bot: BotOtcOrder): Promise<BotOtcOrder>;

  update(bot: BotOtcOrder): Promise<BotOtcOrder>;

  delete(bot: BotOtcOrder): Promise<void>;

  getAll(): Promise<BotOtcOrder[]>;

  getById(id: string): Promise<BotOtcOrder>;

  getAllByBotOtcAndStateIn(
    bot: BotOtc,
    states: BotOtcOrderState[],
  ): Promise<BotOtcOrder[]>;

  getAllByStateInAndCreatedAtBefore(
    states: BotOtcOrderState[],
    createdAt: Date,
  ): Promise<BotOtcOrder[]>;

  /**
   * List all BotOtcOrders by pagination and states.
   * @param pagination Pagination.
   * @param states BotOtcOrder state.
   * @return BotOtcOrders found.
   */
  getAllByPaginationAndStateIn(
    pagination: Pagination,
    states: BotOtcOrderState[],
  ): Promise<TPaginationResponse<BotOtcOrder>>;

  /**
   * Get a Bot Otc order by crypto order id.
   * @param cryptoOrder Crypto Order.
   * @return BotOtcOrder found.
   */
  getByBuyCryptoOrder(cryptoOrder: CryptoOrder): Promise<BotOtcOrder>;

  /**
   * List all BotOtcOrders by filter and pagination.
   * @param pagination Pagination.
   * @param filter Filter.
   * @return BotOtcOrders found.
   */
  getAllByFilterAndPagination(
    pagination: Pagination,
    filter: TGetBotOtcOrderFilter,
  ): Promise<TPaginationResponse<BotOtcOrder>>;

  /**
   * Get all bot otc orders by filter.
   * @param pagination pagination.
   * @param filter filter.
   * @return BotOtcOrders found.
   */
  getAllByFilter(
    pagination: Pagination,
    filter: TGetBotOtcOrdersFilter,
  ): Promise<TPaginationResponse<BotOtcOrder>>;
}
