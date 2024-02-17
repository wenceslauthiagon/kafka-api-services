import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { Cache } from 'cache-manager';
import { isNumber } from 'class-validator';
import { formatValueFromFloatToInt, MissingDataException } from '@zro/common';
import {
  MercadoBitcoinOrderStatusMap,
  MercadoBitcoinOrderSide,
  MercadoBitcoinOrderStatus,
  MercadoBitcoinOrderType,
} from '@zro/mercado-bitcoin/domain';
import {
  CryptoRemittanceGateway,
  CryptoRemittanceGatewayException,
  GetCryptoRemittanceByIdRequest,
  GetCryptoRemittanceByIdResponse,
} from '@zro/otc/application';
import {
  MERCADO_BITCOIN_SERVICES,
  MERCADO_BITCOIN_PROVIDER_NAME,
} from './services.constants';

interface ExecutionResponse {
  executed_at: number;
  fee_rate: string;
  id: string;
  instrument: string;
  price: number;
  qty: string;
  side: MercadoBitcoinOrderSide;
}

interface MercadoBitcoinGetCryptoRemittanceByIdResponse {
  avgPrice: number;
  created_at: number;
  executions: ExecutionResponse[];
  externalId: string;
  fee: string;
  filledQty: string;
  id: string;
  instrument: string;
  limitPrice: number;
  qty: string;
  side: MercadoBitcoinOrderSide;
  status: MercadoBitcoinOrderStatus;
  stopPrice: number;
  triggerOrderId: string;
  type: MercadoBitcoinOrderType;
  updated_at: number;
}

export class MercadoBitcoinGetCryptoRemittanceByIdGateway
  implements Pick<CryptoRemittanceGateway, 'getCryptoRemittanceById'>
{
  constructor(
    private readonly logger: Logger,
    private readonly axios: AxiosInstance,
    private readonly accountId: string,
    private readonly cache: Cache,
  ) {
    this.logger = logger.child({
      context: MercadoBitcoinGetCryptoRemittanceByIdGateway.name,
    });
  }

  async getCryptoRemittanceById(
    request: GetCryptoRemittanceByIdRequest,
  ): Promise<GetCryptoRemittanceByIdResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const { providerOrderId, baseCurrency, market } = request;

    // Data input check
    if (!isNumber(baseCurrency?.decimal)) {
      throw new MissingDataException(['Base currency decimal']);
    }

    try {
      this.logger.debug('Request params.', { id: request.providerOrderId });

      const response =
        await this.axios.get<MercadoBitcoinGetCryptoRemittanceByIdResponse>(
          `${MERCADO_BITCOIN_SERVICES.ORDER(
            this.accountId,
            market.name,
          )}/${providerOrderId}`,
        );

      // FIXME: Verificar como o Mercado Bitcoin notifica ordens nao encontradas.

      this.logger.debug('Response found.', { data: response.data });

      const { status, avgPrice, filledQty } = response.data;

      const executedPrice =
        avgPrice &&
        formatValueFromFloatToInt(avgPrice, market.priceSignificantDigits);

      const executedQuantity =
        filledQty && formatValueFromFloatToInt(filledQty, baseCurrency.decimal);

      return {
        id: response.data.externalId,
        providerOrderId,
        providerName: MERCADO_BITCOIN_PROVIDER_NAME,
        status: MercadoBitcoinOrderStatusMap[status],
        executedPrice,
        executedQuantity,
      };
    } catch (error) {
      this.logger.error('Unexpected Mercado Bitcoin gateway error', {
        error: error.isAxiosError ? error.message : error,
        request: error.config,
        response: error.response?.data ?? error.response ?? error,
      });
      throw new CryptoRemittanceGatewayException(error);
    }
  }
}
