import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { Cache } from 'cache-manager';
import { formatValueFromIntToFloat } from '@zro/common';
import { CryptoMarket, OrderSide, OrderType } from '@zro/otc/domain';
import {
  CryptoRemittanceGateway,
  CryptoRemittanceGatewayException,
  OrderNotPlacedCryptoRemittanceGatewayException,
  CreateCryptoRemittanceRequest,
  CreateCryptoRemittanceResponse,
  CreateCryptoRemittanceVerify,
} from '@zro/otc/application';
import {
  MercadoBitcoinOrderSide,
  MercadoBitcoinOrderStatus,
  MercadoBitcoinOrderStatusMap,
  MercadoBitcoinOrderType,
} from '@zro/mercado-bitcoin/domain';
import {
  MercadoBitcoinGetCryptoRemittanceByIdGateway,
  MercadoBitcoinGetCryptoMarketsGateway,
  MERCADO_BITCOIN_SERVICES,
  MERCADO_BITCOIN_PROVIDER_NAME,
} from '@zro/mercado-bitcoin/infrastructure';

interface MercadoBitcoinCreateOrderConversionRequest {
  async: boolean;
  cost?: number;
  externalId: string;
  limitPrice?: number;
  qty?: number;
  side: MercadoBitcoinOrderSide;
  stopPrice?: number;
  type: MercadoBitcoinOrderType;
}

interface MercadoBitcoinCreateOrderConversionResponse {
  orderId: string;
  status: string;
}

export class MercadoBitcoinCreateCryptoRemittanceGateway
  extends CreateCryptoRemittanceVerify
  implements Pick<CryptoRemittanceGateway, 'createCryptoRemittance'>
{
  static orderTypes = {
    [OrderType.LIMIT]: MercadoBitcoinOrderType.LIMIT,
    [OrderType.MARKET]: MercadoBitcoinOrderType.MARKET,
  };

  static orderSides = {
    [OrderSide.BUY]: MercadoBitcoinOrderSide.BUY,
    [OrderSide.SELL]: MercadoBitcoinOrderSide.SELL,
  };

  private getOrderGateway: MercadoBitcoinGetCryptoRemittanceByIdGateway;
  private readonly getMarketsGateway: MercadoBitcoinGetCryptoMarketsGateway;

  constructor(
    private readonly logger: Logger,
    private readonly axios: AxiosInstance,
    private readonly accountId: string,
    private readonly cache: Cache,
  ) {
    super();
    this.logger = logger.child({
      context: MercadoBitcoinCreateCryptoRemittanceGateway.name,
    });

    this.getOrderGateway = new MercadoBitcoinGetCryptoRemittanceByIdGateway(
      logger,
      axios,
      accountId,
      cache,
    );

    this.getMarketsGateway = new MercadoBitcoinGetCryptoMarketsGateway(
      this.logger,
      this.cache,
    );
  }

  isTypeSupported(type: OrderType): boolean {
    return !!MercadoBitcoinCreateCryptoRemittanceGateway.orderTypes[type];
  }

  isSideSupported(side: OrderSide): boolean {
    return !!MercadoBitcoinCreateCryptoRemittanceGateway.orderSides[side];
  }

  async isMarketEnabled(market: CryptoMarket): Promise<boolean> {
    const allowedMarkets =
      await this.getMarketsGateway.getMercadoBitcoinMarkets();

    const allowedMarket = allowedMarkets.find(
      (allowedMarket) => market.name === allowedMarket.id,
    );

    // Check if market exists and it is enabled.
    return allowedMarket?.exchangeTraded;
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
      price,
      side,
      amount,
      market,
      stopPrice,
    } = request;

    const size = formatValueFromIntToFloat(amount, baseCurrency.decimal);
    const orderType =
      MercadoBitcoinCreateCryptoRemittanceGateway.orderTypes[type];
    const orderSide =
      MercadoBitcoinCreateCryptoRemittanceGateway.orderSides[side];

    try {
      const placePayload: MercadoBitcoinCreateOrderConversionRequest = {
        async: true,
        externalId: request.id,
        qty: size,
        side: orderSide,
        type: orderType,
      };

      if (type === OrderType.LIMIT) {
        placePayload.stopPrice = formatValueFromIntToFloat(
          stopPrice,
          quoteCurrency.decimal,
        );
        placePayload.limitPrice = formatValueFromIntToFloat(
          price,
          quoteCurrency.decimal,
        );
      }

      this.logger.debug('Request payload.', { payload: placePayload });

      const placeResponse =
        await this.axios.post<MercadoBitcoinCreateOrderConversionResponse>(
          MERCADO_BITCOIN_SERVICES.ORDER(this.accountId, market.name),
          placePayload,
        );

      this.logger.debug('Response found.', { data: placeResponse.data });

      const { orderId, status } = placeResponse.data;

      if (status === MercadoBitcoinOrderStatus.CANCELLED) {
        throw new OrderNotPlacedCryptoRemittanceGatewayException(
          placeResponse.data,
        );
      }

      const order: CreateCryptoRemittanceResponse = {
        id: request.id,
        providerOrderId: orderId,
        providerName: MERCADO_BITCOIN_PROVIDER_NAME,
        status: MercadoBitcoinOrderStatusMap[status],
      };

      // Get missing data safely.
      try {
        const getResponse = await this.getOrderGateway.getCryptoRemittanceById({
          providerOrderId: orderId,
          baseCurrency,
          quoteCurrency,
          market,
        });

        order.executedPrice = getResponse?.executedPrice;
        order.executedQuantity = getResponse?.executedQuantity;
      } catch (error) {
        this.logger.error('Unexpected MercadoBitcoin gateway error', {
          error: error.isAxiosError ? error.message : error,
          request: error.config,
          response: error.response?.data ?? error.response ?? error,
        });

        // TODO: Notify IT Team
      }

      return order;
    } catch (error) {
      this.logger.error('Unexpected MercadoBitcoin gateway error', {
        error: error.isAxiosError ? error.message : error,
        request: error.config,
        response: error.response?.data ?? error.response ?? error,
      });
      throw new CryptoRemittanceGatewayException(error);
    }
  }
}
