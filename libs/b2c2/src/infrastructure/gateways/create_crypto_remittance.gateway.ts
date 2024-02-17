import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { Cache } from 'cache-manager';
import {
  formatValueFromFloatToInt,
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
  OfflineCryptoRemittanceGatewayException,
} from '@zro/otc/application';
import { B2C2OrderType, B2C2OrderSide } from '@zro/b2c2/domain';
import {
  B2C2GetCryptoMarketsGateway,
  B2C2_SERVICES,
  B2C2_PROVIDER_NAME,
} from '@zro/b2c2/infrastructure';

type B2C2CreateOrderConversionRequest = {
  client_order_id: string;
  quantity: string;
  side: B2C2OrderSide;
  instrument: string;
  order_type: B2C2OrderType;
  price?: number;
  force_open?: boolean;
  valid_until?: string;
  acceptable_slippage_in_basis_points?: string;
  executing_unit?: string;
};

type B2C2CreateOrderConversionResponseTrade = {
  instrument: string;
  trade_id: string;
  origin: string;
  rfq_id: string;
  created: string;
  price: string;
  quantity: string;
  order: string;
  side: B2C2OrderSide;
  executing_unit: string;
};

interface B2C2CreateOrderConversionResponse {
  order_id: string;
  client_order_id: string;
  quantity: string;
  side: B2C2OrderSide;
  instrument: string;
  order_type: B2C2OrderType;
  price: string;
  executed_price: string;
  executing_unit: string;
  trades: B2C2CreateOrderConversionResponseTrade[];
  created: Date;
}

export class B2C2CreateCryptoRemittanceGateway
  extends CreateCryptoRemittanceVerify
  implements Pick<CryptoRemittanceGateway, 'createCryptoRemittance'>
{
  static orderTypes = {
    [OrderType.MARKET]: B2C2OrderType.MKT,
    [OrderType.LIMIT]: B2C2OrderType.FOK,
  };

  static orderSides = {
    [OrderSide.BUY]: B2C2OrderSide.BUY,
    [OrderSide.SELL]: B2C2OrderSide.SELL,
  };

  private readonly getMarketsGateway: B2C2GetCryptoMarketsGateway;

  constructor(
    private readonly cache: Cache,
    private readonly logger: Logger,
    private readonly axios: AxiosInstance,
  ) {
    super();
    this.logger = logger.child({
      context: B2C2CreateCryptoRemittanceGateway.name,
    });

    this.getMarketsGateway = new B2C2GetCryptoMarketsGateway(
      this.logger,
      this.cache,
    );
  }

  isTypeSupported(type: OrderType): boolean {
    return !!B2C2CreateCryptoRemittanceGateway.orderTypes[type];
  }

  isSideSupported(side: OrderSide): boolean {
    return !!B2C2CreateCryptoRemittanceGateway.orderSides[side];
  }

  async isMarketEnabled(market: CryptoMarket): Promise<boolean> {
    const allowedMarkets = await this.getMarketsGateway.getB2C2Markets();

    const allowedMarket = allowedMarkets.find(
      (allowedMarket) => market.name === allowedMarket.name,
    );

    // Check if market exists and it is enabled.
    return allowedMarket?.isTradable;
  }

  async createCryptoRemittance(
    request: CreateCryptoRemittanceRequest,
  ): Promise<CreateCryptoRemittanceResponse> {
    // Check request
    await this.verify(request);

    const {
      baseCurrency,
      quoteCurrency,
      type,
      validUntil,
      price,
      side,
      amount,
      market,
    } = request;

    const size = formatValueFromIntToFloat(amount, baseCurrency.decimal);
    const orderType = B2C2CreateCryptoRemittanceGateway.orderTypes[type];
    const orderSide = B2C2CreateCryptoRemittanceGateway.orderSides[side];

    try {
      const payload: B2C2CreateOrderConversionRequest = {
        client_order_id: request.id,
        quantity: size.toString(),
        order_type: orderType,
        instrument: market.name,
        side: orderSide,
        valid_until: new Date(Date.now() + 600000).toISOString(),
      };

      if (type === OrderType.LIMIT) {
        payload.valid_until = validUntil.toISOString();
        payload.price = formatValueFromIntToFloat(price, quoteCurrency.decimal);
      }

      this.logger.info('Request payload.', { payload });

      const response = await this.axios.post<B2C2CreateOrderConversionResponse>(
        B2C2_SERVICES.ORDER,
        payload,
      );

      this.logger.info('Response found.', { data: response.data });

      const result = response.data;

      const executedPrice =
        result.executed_price &&
        formatValueFromFloatToInt(
          result.executed_price,
          market.priceSignificantDigits,
        );

      let executedQuantity = null;
      let status = null;

      // Check if order failed
      if (!executedPrice) {
        status = CryptoRemittanceStatus.ERROR;
        this.logger.error('Failed to place an order.', { data: response.data });
      } else {
        executedQuantity =
          result.quantity &&
          formatValueFromFloatToInt(result.quantity, baseCurrency.decimal);

        status = CryptoRemittanceStatus.FILLED;
      }

      return {
        id: result.client_order_id,
        providerOrderId: result.order_id,
        providerName: B2C2_PROVIDER_NAME,
        status,
        executedPrice,
        executedQuantity,
      };
    } catch (error) {
      this.logger.error('ERROR B2C2 request.', {
        error: error.isAxiosError ? error.message : error,
      });

      const parseMessage = (message: string) => {
        if (!message) return;

        if (message.startsWith('Temporary connectivity issues')) {
          throw new OfflineCryptoRemittanceGatewayException(error);
        }
      };

      if (error.response?.data) {
        this.logger.error('ERROR B2C2 response data.', {
          error: error.response.data,
        });

        const { errors } = error.response.data;
        const messages = errors.map((e) => e.message);
        messages.forEach(parseMessage);
      }

      this.logger.error('Unexpected B2C2 gateway error', {
        error: error.isAxiosError ? error.message : error,
        request: error.config,
        response: error.response?.data ?? error.response ?? error,
      });
      throw new CryptoRemittanceGatewayException(error);
    }
  }
}
