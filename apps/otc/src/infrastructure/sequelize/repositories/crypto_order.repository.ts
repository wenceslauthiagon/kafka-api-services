import { DatabaseRepository } from '@zro/common';
import {
  CryptoOrder,
  CryptoOrderRepository,
  CryptoOrderState,
  CryptoRemittance,
  OrderType,
} from '@zro/otc/domain';
import { Currency } from '@zro/operations/domain';
import { ConversionModel, CryptoOrderModel } from '@zro/otc/infrastructure';

export class CryptoOrderDatabaseRepository
  extends DatabaseRepository
  implements CryptoOrderRepository
{
  static toDomain(model: CryptoOrderModel): CryptoOrder {
    return model?.toDomain() ?? null;
  }

  async create(cryptoOrders: CryptoOrder): Promise<CryptoOrder> {
    const createdCryptoOrder = await CryptoOrderModel.create<CryptoOrderModel>(
      cryptoOrders,
      { transaction: this.transaction },
    );

    cryptoOrders.id = createdCryptoOrder.id;
    cryptoOrders.createdAt = createdCryptoOrder.createdAt;

    return cryptoOrders;
  }

  async update(cryptoOrders: CryptoOrder): Promise<CryptoOrder> {
    await CryptoOrderModel.update<CryptoOrderModel>(cryptoOrders, {
      where: { id: cryptoOrders.id },
      transaction: this.transaction,
    });

    return cryptoOrders;
  }

  async getById(id: string): Promise<CryptoOrder> {
    return CryptoOrderModel.findOne<CryptoOrderModel>({
      where: {
        id,
      },
      transaction: this.transaction,
      lock: this.transaction?.LOCK.UPDATE,
    }).then(CryptoOrderDatabaseRepository.toDomain);
  }

  async getAllByState(state: CryptoOrderState): Promise<CryptoOrder[]> {
    return CryptoOrderModel.findAll<CryptoOrderModel>({
      where: {
        state,
      },
      transaction: this.transaction,
      lock: this.transaction?.LOCK.UPDATE,
    }).then((data) => data.map(CryptoOrderDatabaseRepository.toDomain));
  }

  async getAllByBaseCurrencyAndState(
    baseCurrency: Currency,
    state: CryptoOrderState,
  ): Promise<CryptoOrder[]> {
    return CryptoOrderModel.findAll<CryptoOrderModel>({
      where: {
        baseCurrencyId: baseCurrency.id,
        state,
      },
      transaction: this.transaction,
      lock: this.transaction?.LOCK.UPDATE,
    }).then((data) => data.map(CryptoOrderDatabaseRepository.toDomain));
  }

  /**
   * Get all Crypto Orders by state and base currency.
   * @param state CryptoOrder state.
   * @param baseCurrency Base currency.
   * @param type Order type.
   * @returns Found crypto orders or empty otherwise.
   */
  async getAllWithConversionByBaseCurrencyAndStateAndType(
    baseCurrency: Currency,
    state: CryptoOrderState,
    type: OrderType,
  ): Promise<CryptoOrder[]> {
    return CryptoOrderModel.findAll<CryptoOrderModel>({
      where: { baseCurrencyId: baseCurrency.id, state, type },
      include: { model: ConversionModel },
      transaction: this.transaction,
      lock: this.transaction?.LOCK.UPDATE,
    }).then((data) => data.map(CryptoOrderDatabaseRepository.toDomain));
  }

  /**
   * Get all Crypto Order by crypto remittance.
   * @param cryptoRemittance Crypto remittance.
   * @returns Found crypto orders or empty otherwise.
   */
  async getAllByCryptoRemittance(
    cryptoRemittance: CryptoRemittance,
  ): Promise<CryptoOrder[]> {
    return CryptoOrderModel.findAll<CryptoOrderModel>({
      where: { cryptoRemittanceId: cryptoRemittance.id },
      transaction: this.transaction,
      lock: this.transaction?.LOCK.UPDATE,
    }).then((data) => data.map(CryptoOrderDatabaseRepository.toDomain));
  }
}
