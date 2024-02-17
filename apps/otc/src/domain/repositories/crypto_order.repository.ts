import { Currency } from '@zro/operations/domain';
import {
  CryptoOrder,
  CryptoOrderState,
  CryptoRemittance,
  OrderType,
} from '@zro/otc/domain';

export interface CryptoOrderRepository {
  /**
   * Insert a Crypto Order.
   * @param criptoOrders Crypto Order to save.
   * @returns Created Crypto Order.
   */
  create(criptoOrders: CryptoOrder): Promise<CryptoOrder>;

  /**
   * Update a Crypto Order.
   * @param Crypto Order to update.
   * @returns Updated Crypto Order.
   */
  update(criptoOrders: CryptoOrder): Promise<CryptoOrder>;

  /**
   * Search by Crypto Order ID.
   * @param id Crypto Order ID.
   * @return Crypto Order found or null otherwise.
   */
  getById(id: string): Promise<CryptoOrder>;

  /**
   * Get all Crypto Orders by state.
   * @param state CryptoOrder state to update.
   * @returns Found crypto orders or empty otherwise.
   */
  getAllByState(state: CryptoOrderState): Promise<CryptoOrder[]>;

  /**
   * Get all Crypto Orders by state and base currency.
   * @param state CryptoOrder state.
   * @param baseCurrency Base currency.
   * @returns Found crypto orders or empty otherwise.
   */
  getAllByBaseCurrencyAndState(
    baseCurrency: Currency,
    state: CryptoOrderState,
  ): Promise<CryptoOrder[]>;

  /**
   * Get all Crypto Order with conversion by state and base currency.
   * @param state CryptoOrder state.
   * @param baseCurrency Base currency.
   * @param type Order type.
   * @returns Found crypto orders or empty otherwise.
   */
  getAllWithConversionByBaseCurrencyAndStateAndType(
    baseCurrency: Currency,
    state: CryptoOrderState,
    type: OrderType,
  ): Promise<CryptoOrder[]>;

  /**
   * Get all Crypto Order by crypto remittance.
   * @param cryptoRemittance Crypto remittance.
   * @returns Found crypto orders or empty otherwise.
   */
  getAllByCryptoRemittance(
    cryptoRemittance: CryptoRemittance,
  ): Promise<CryptoOrder[]>;
}
