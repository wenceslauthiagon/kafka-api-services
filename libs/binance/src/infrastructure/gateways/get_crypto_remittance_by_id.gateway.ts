import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import {
  formatValueFromFloatToInt,
  formatValueFromIntBpsToFloat,
  MissingDataException,
} from '@zro/common';
import {
  CryptoRemittanceGateway,
  CryptoRemittanceGatewayException,
  GetCryptoRemittanceByIdRequest,
  GetCryptoRemittanceByIdResponse,
} from '@zro/otc/application';
import { BINANCE_SERVICES, BINANCE_PROVIDER_NAME } from './services.constants';
import {
  BinanceOrderSide,
  BinanceOrderStatus,
  binanceOrderStatusMap,
  BinanceOrderType,
  BinanceTimeInForce,
} from '@zro/binance/domain';

type BinanceGetOrderByIdRequest = {
  symbol: string;
  orderId: number;
};

interface BinanceGetOrderByIdResponse {
  symbol: string;
  orderId: number;
  orderListId: number;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: BinanceOrderStatus;
  timeInForce: BinanceTimeInForce;
  type: BinanceOrderType;
  side: BinanceOrderSide;
  stopPrice: string;
  icebergQty: string;
  time: number;
  updateTime: number;
  isWorking: true;
  workingTime: number;
  origQuoteOrderQty: string;
  selfTradePreventionMode: string;
}

export class BinanceGetCryptoRemittanceByIdGateway
  implements Pick<CryptoRemittanceGateway, 'getCryptoRemittanceById'>
{
  constructor(
    private readonly logger: Logger,
    private readonly axios: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: BinanceGetCryptoRemittanceByIdGateway.name,
    });
  }

  async getCryptoRemittanceById(
    request: GetCryptoRemittanceByIdRequest,
  ): Promise<GetCryptoRemittanceByIdResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const { providerOrderId, baseCurrency, quoteCurrency, market } = request;

    // Data input check
    if (!baseCurrency?.symbol) {
      throw new MissingDataException(['Base currency symbol']);
    }
    if (!quoteCurrency?.symbol) {
      throw new MissingDataException(['Quote currency symbol']);
    }

    const params: BinanceGetOrderByIdRequest = {
      symbol: `${baseCurrency.symbol}${quoteCurrency.symbol}`,
      orderId: parseInt(providerOrderId),
    };

    try {
      this.logger.debug('Request params.', { params });

      const response = await this.axios.get<BinanceGetOrderByIdResponse>(
        `${BINANCE_SERVICES.ORDERS(params)}`,
      );

      this.logger.debug('Response found.', { data: response.data });

      if (!response.data?.orderId) return;

      const result = response.data;

      let executedPrice = 0;

      if (
        parseFloat(result.cummulativeQuoteQty) &&
        parseFloat(result.executedQty)
      ) {
        executedPrice =
          parseFloat(result.cummulativeQuoteQty) /
          parseFloat(result.executedQty);

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

      let executedQuantity = parseFloat(result.executedQty);

      executedQuantity =
        executedQuantity &&
        formatValueFromFloatToInt(executedQuantity, baseCurrency.decimal);

      return {
        id: result.clientOrderId,
        providerOrderId,
        providerName: BINANCE_PROVIDER_NAME,
        status: binanceOrderStatusMap(result.status),
        executedPrice,
        executedQuantity,
      };
    } catch (error) {
      this.logger.error('Unexpected Binance gateway error.', {
        error: error.isAxiosError ? error.message : error,
        request: error.config,
        response: error.response?.data ?? error.response ?? error,
      });
      throw new CryptoRemittanceGatewayException(error);
    }
  }
}
