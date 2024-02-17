import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { Cache } from 'cache-manager';
import {
  formatValueFromFloatToInt,
  formatValueFromIntBpsToFloat,
  formatValueFromIntToFloat,
} from '@zro/common';
import {
  OrderType,
  OrderSide,
  CryptoMarket,
  CryptoRemittanceStatus,
} from '@zro/otc/domain';
import {
  CryptoRemittanceGateway,
  CryptoRemittanceGatewayException,
  CreateCryptoRemittanceRequest,
  CreateCryptoRemittanceResponse,
  CreateCryptoRemittanceVerify,
} from '@zro/otc/application';
import {
  BinanceOrderRespType,
  BinanceOrderSide,
  BinanceOrderStatus,
  binanceOrderStatusMap,
  BinanceOrderType,
  BinanceSymbolStatus,
  BinanceTimeInForce,
} from '@zro/binance/domain';
import {
  BinanceGetCryptoMarketsGateway,
  BINANCE_PROVIDER_NAME,
  BINANCE_SERVICES,
} from '@zro/binance/infrastructure';

type BinanceCreateOrderRequest = {
  symbol: string;
  side: BinanceOrderSide;
  type: BinanceOrderType;
  newClientOrderId: string;
  timeInForce?: BinanceTimeInForce;
  quantity: number;
  price?: number;
  quoteOrderQty?: number; //quantity OR quoteOrderQty mandatory for market
  strategyId?: number;
  strategyType?: number;
  stopPrice?: number;
  trailingDelta?: number;
  icebergQty?: number;
  newOrderRespType?: BinanceOrderRespType;
  recvWindow?: number;
  timestamp?: number;
};

type BinanceOrderFill = {
  price: string;
  qty: string;
  commission: string;
  commissionAsset: string;
  tradeId: number;
};

interface BinanceCreateOrderResponse {
  symbol: string;
  orderId: number;
  orderListId: number;
  clientOrderId: string;
  transactTime: number;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: BinanceOrderStatus;
  timeInForce: BinanceTimeInForce;
  type: BinanceOrderType;
  side: BinanceOrderSide;
  workingTime: number;
  fills: BinanceOrderFill[];
  selfTradePreventionMode: string;
}

export class BinanceCreateCryptoRemittanceGateway
  extends CreateCryptoRemittanceVerify
  implements Pick<CryptoRemittanceGateway, 'createCryptoRemittance'>
{
  static orderTypes = {
    [OrderType.MARKET]: BinanceOrderType.MARKET,
    [OrderType.LIMIT]: BinanceOrderType.LIMIT,
  };

  static orderSides = {
    [OrderSide.BUY]: BinanceOrderSide.BUY,
    [OrderSide.SELL]: BinanceOrderSide.SELL,
  };

  private readonly getMarketsGateway: BinanceGetCryptoMarketsGateway;

  constructor(
    private readonly cache: Cache,
    private readonly logger: Logger,
    private readonly axios: AxiosInstance,
  ) {
    super();
    this.logger = logger.child({
      context: BinanceCreateCryptoRemittanceGateway.name,
    });

    this.getMarketsGateway = new BinanceGetCryptoMarketsGateway(
      this.cache,
      this.logger,
    );
  }

  isTypeSupported(type: OrderType): boolean {
    return !!BinanceCreateCryptoRemittanceGateway.orderTypes[type];
  }

  isSideSupported(side: OrderSide): boolean {
    return !!BinanceCreateCryptoRemittanceGateway.orderSides[side];
  }

  async isMarketEnabled(market: CryptoMarket): Promise<boolean> {
    const allowedMarkets = await this.getMarketsGateway.getBinanceMarkets();
    const allowedMarket = allowedMarkets.find((allowedMarket) => {
      const allowedMarketName = `${allowedMarket.baseCurrencySymbol}${allowedMarket.quoteCurrencySymbol}`;
      return market.name === allowedMarketName;
    });

    // Check if market exists and it is enabled.
    const isEnabled = allowedMarket?.status === BinanceSymbolStatus.TRADING;
    return isEnabled;
  }

  async createCryptoRemittance(
    request: CreateCryptoRemittanceRequest,
  ): Promise<CreateCryptoRemittanceResponse> {
    // Check request
    await this.verify(request);

    const { baseCurrency, quoteCurrency, type, price, side, amount, market } =
      request;

    const size = formatValueFromIntToFloat(amount, baseCurrency.decimal);
    const orderType = BinanceCreateCryptoRemittanceGateway.orderTypes[type];
    const orderSide = BinanceCreateCryptoRemittanceGateway.orderSides[side];

    try {
      const params: BinanceCreateOrderRequest = {
        symbol: `${baseCurrency.symbol}${quoteCurrency.symbol}`,
        side: orderSide,
        type: orderType,
        quantity: size,
        newClientOrderId: request.id,
      };

      if (type === OrderType.LIMIT) {
        // Fill or Kill.
        params.timeInForce = BinanceTimeInForce.FOK;
        params.price = formatValueFromIntToFloat(
          price,
          market.priceSignificantDigits,
        );
      }

      this.logger.info('Request params.', { params });

      const response = await this.axios.post<BinanceCreateOrderResponse>(
        BINANCE_SERVICES.ORDERS(params),
      );

      this.logger.info('Response found.', { data: response.data });

      if (!response.data?.orderId) return;

      const result = response.data;

      let executedPrice = 0;
      let executedQuantity = 0;

      if (
        parseFloat(result.cummulativeQuoteQty) &&
        parseFloat(result.executedQty)
      ) {
        executedQuantity = parseFloat(result.executedQty);

        executedPrice =
          parseFloat(result.cummulativeQuoteQty) / executedQuantity;

        executedQuantity = formatValueFromFloatToInt(
          executedQuantity,
          baseCurrency.decimal,
        );

        executedPrice = formatValueFromFloatToInt(
          executedPrice,
          market.priceSignificantDigits,
        );

        if (market.fee) {
          executedPrice = formatValueFromFloatToInt(
            executedPrice * (1 - formatValueFromIntBpsToFloat(market.fee)),
            0,
          );
        }
      }

      let status = result.status && binanceOrderStatusMap(result.status);

      // If order has no status, set status to error.
      if (!status) {
        status = CryptoRemittanceStatus.ERROR;
        this.logger.error('Failed to place an order.', { data: response.data });
      }

      return {
        id: result.clientOrderId,
        providerOrderId: `${result.orderId}`,
        providerName: BINANCE_PROVIDER_NAME,
        status,
        executedPrice,
        executedQuantity,
      };
    } catch (error) {
      this.logger.error('Unexpected Binance gateway error', {
        error: error.isAxiosError ? error.message : error,
        request: error.config,
        response: error.response?.data ?? error.response ?? error,
      });
      throw new CryptoRemittanceGatewayException(error);
    }
  }
}
