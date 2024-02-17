import {
  MissingDataException,
  NotImplementedException,
  formatValueFromIntToFloat,
} from '@zro/common';
import {
  CryptoMarket,
  CryptoRemittance,
  OrderSide,
  CryptoRemittanceStatus,
  OrderType,
} from '@zro/otc/domain';
import {
  OrderAmountNotSupportedCryptoRemittanceGatewayException,
  OrderAmountOverflowCryptoRemittanceGatewayException,
  OrderAmountUnderflowCryptoRemittanceGatewayException,
  OrderInvalidStopPriceCryptoRemittanceGatewayException,
  OrderInvalidUntilDateCryptoRemittanceGatewayException,
  OrderPriceNotSupportedCryptoRemittanceGatewayException,
  OrderPriceUnderflowCryptoRemittanceGatewayException,
  OrderSideNotSupportedCryptoRemittanceGatewayException,
  OrderTypeNotSupportedCryptoRemittanceGatewayException,
  PairNotSupportedCryptoRemittanceGatewayException,
} from '@zro/otc/application';

export type CreateCryptoRemittanceRequest = Pick<
  CryptoRemittance,
  | 'id'
  | 'baseCurrency'
  | 'quoteCurrency'
  | 'type'
  | 'validUntil'
  | 'price'
  | 'stopPrice'
  | 'side'
  | 'amount'
  | 'market'
>;

export interface CreateCryptoRemittanceResponse {
  id: string;
  providerOrderId: string;
  providerName: string;
  status: CryptoRemittanceStatus;
  executedPrice?: number;
  executedQuantity?: number;
  fee?: number;
}

export interface CreateCryptoRemittanceGateway {
  createCryptoRemittance(
    data: CreateCryptoRemittanceRequest,
  ): Promise<CreateCryptoRemittanceResponse>;
}

export abstract class CreateCryptoRemittanceVerify {
  isTypeSupported(type: OrderType): boolean {
    throw new NotImplementedException(
      `Type ${type} checker not implemented by subclass`,
    );
  }

  isSideSupported(side: OrderSide): boolean {
    throw new NotImplementedException(
      `Side ${side} checker not implemented by subclass`,
    );
  }

  isMarketEnabled(market: CryptoMarket): Promise<boolean> {
    throw new NotImplementedException(
      `Market ${market.name} checker not implemented by subclass`,
    );
  }

  async verify(request: CreateCryptoRemittanceRequest): Promise<void> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Request']);
    }

    const { baseCurrency, quoteCurrency, type, market, side, amount } = request;

    let { validUntil, price, stopPrice } = request;

    if (!baseCurrency?.symbol) {
      throw new MissingDataException(['Base Currency']);
    }

    if (!quoteCurrency?.symbol) {
      throw new MissingDataException(['Quote Currency']);
    }

    if (!type || !market || !side || !amount) {
      throw new MissingDataException([
        ...(!type ? ['Type'] : []),
        ...(!market ? ['Market'] : []),
        ...(!side ? ['Side'] : []),
        ...(!amount ? ['Amount'] : []),
      ]);
    }

    if (type === OrderType.LIMIT && market.requireValidUntil && !validUntil) {
      throw new MissingDataException(['Valid Until']);
    }

    if (type === OrderType.LIMIT && market.requireStopPrice && !stopPrice) {
      throw new MissingDataException(['Stop Price']);
    }

    if (type === OrderType.LIMIT && !price) {
      throw new MissingDataException(['Price']);
    }

    if (type === OrderType.MARKET && price) {
      delete request.price;
      price = null;
    }

    if (type === OrderType.MARKET && validUntil) {
      delete request.validUntil;
      validUntil = null;
    }

    if (type === OrderType.MARKET && stopPrice) {
      delete request.stopPrice;
      stopPrice = null;
    }

    if (price && price <= 0) {
      throw new OrderPriceUnderflowCryptoRemittanceGatewayException(request);
    }

    // Check valid until if available
    if (validUntil && Date.now() >= validUntil.valueOf()) {
      throw new OrderInvalidUntilDateCryptoRemittanceGatewayException(request);
    }

    // Check stop price
    if (price && stopPrice) {
      if (side === OrderSide.BUY && price < stopPrice) {
        throw new OrderInvalidStopPriceCryptoRemittanceGatewayException(
          request,
        );
      } else if (side === OrderSide.SELL && price > stopPrice) {
        throw new OrderInvalidStopPriceCryptoRemittanceGatewayException(
          request,
        );
      }
    }

    // Get market constraints
    const { minSize, maxSize, sizeIncrement, priceIncrement } = market;

    // Check if price is multiple of price increment constraint.
    if (price && priceIncrement && price % priceIncrement !== 0) {
      throw new OrderPriceNotSupportedCryptoRemittanceGatewayException(request);
    }

    // Check if size is above minimal required.
    if (amount <= 0 || (minSize && amount < minSize)) {
      throw new OrderAmountUnderflowCryptoRemittanceGatewayException(request);
    }

    // Check if size is above minimal required.
    if (maxSize && amount > maxSize) {
      throw new OrderAmountOverflowCryptoRemittanceGatewayException(request);
    }

    // Check if size is multiple of size increment constraint.
    if (sizeIncrement && amount % sizeIncrement) {
      throw new OrderAmountNotSupportedCryptoRemittanceGatewayException(
        request,
      );
    }

    // Check if price and amount are valid for notional rules.
    if (
      type === OrderType.LIMIT &&
      price &&
      (market.minNotional || market.maxNotional)
    ) {
      const total =
        price * formatValueFromIntToFloat(amount, market.baseCurrency.decimal);
      if (
        (market.minNotional && total < market.minNotional) ||
        (market.maxNotional && total > market.maxNotional)
      ) {
        throw new OrderAmountNotSupportedCryptoRemittanceGatewayException(
          request,
        );
      }
    }

    // Sanitize order type
    if (!this.isTypeSupported(type)) {
      throw new OrderTypeNotSupportedCryptoRemittanceGatewayException(type);
    }

    // Sanitize order type
    if (!this.isSideSupported(side)) {
      throw new OrderSideNotSupportedCryptoRemittanceGatewayException(side);
    }

    // Sanitize order type
    if (!(await this.isMarketEnabled(market))) {
      throw new PairNotSupportedCryptoRemittanceGatewayException(market);
    }
  }
}
