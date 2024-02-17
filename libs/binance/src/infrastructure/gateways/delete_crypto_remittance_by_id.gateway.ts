import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  CryptoRemittanceGateway,
  CryptoRemittanceGatewayException,
  DeleteCryptoRemittanceByIdRequest,
  DeleteCryptoRemittanceByIdResponse,
} from '@zro/otc/application';
import { BINANCE_ERROR_CODE, BINANCE_SERVICES } from './services.constants';
import { BinanceOrderStatus } from '@zro/binance/domain';

type BinanceDeleteCryptoRemittanceByIdRequest = {
  symbol: string;
  orderId: number;
};

type BinanceDeleteCryptoRemittanceByIdReponse = {
  symbol: string;
  origClientOrderId: string;
  orderId: number;
  orderListId: number;
  clientOrderId: string;
  transactTime: number;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
  selfTradePreventionMode: string;
};

export class BinanceDeleteCryptoRemittanceByIdGateway
  implements Pick<CryptoRemittanceGateway, 'deleteCryptoRemittanceById'>
{
  constructor(
    private readonly logger: Logger,
    private readonly axios: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: BinanceDeleteCryptoRemittanceByIdGateway.name,
    });
  }

  async deleteCryptoRemittanceById(
    request: DeleteCryptoRemittanceByIdRequest,
  ): Promise<DeleteCryptoRemittanceByIdResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const { id, baseCurrency, quoteCurrency } = request;

    const params: BinanceDeleteCryptoRemittanceByIdRequest = {
      symbol: `${baseCurrency.symbol}${quoteCurrency.symbol}`,
      orderId: parseInt(id),
    };

    try {
      this.logger.debug('Request params.', { params });

      const response =
        await this.axios.delete<BinanceDeleteCryptoRemittanceByIdReponse>(
          BINANCE_SERVICES.ORDERS(params),
        );

      this.logger.debug('Response found.', { data: response.data });

      // Return if order was not deleted.
      if (!response.data?.status) return;

      if (response.data.status !== BinanceOrderStatus.CANCELED) return;

      return {
        id,
      };
    } catch (error) {
      // Return if error is from binance and order was not deleted.
      if (error.response?.data?.code <= BINANCE_ERROR_CODE) {
        const errorData = error.response.data;

        this.logger.error('ERROR Binance response data.', {
          error: errorData,
        });

        return;
      }

      this.logger.error('Unexpected Binance gateway error', {
        error: error.isAxiosError ? error.message : error,
        request: error.config,
        response: error.response?.data ?? error.response ?? error,
      });
      throw new CryptoRemittanceGatewayException(error);
    }
  }
}
