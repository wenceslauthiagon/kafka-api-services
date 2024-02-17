import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { isNumber } from 'class-validator';
import { formatValueFromFloatToInt, MissingDataException } from '@zro/common';
import { CryptoRemittanceStatus } from '@zro/otc/domain';
import { B2C2OrderSide, B2C2OrderType } from '@zro/b2c2/domain';
import {
  CryptoRemittanceGateway,
  CryptoRemittanceGatewayException,
  GetCryptoRemittanceByIdRequest,
  GetCryptoRemittanceByIdResponse,
} from '@zro/otc/application';
import { B2C2_SERVICES, B2C2_PROVIDER_NAME } from './services.constants';

interface B2C2GetOrderByIdConversionResponse {
  client_order_id: string;
  instrument: string;
  price: string;
  executed_price: string;
  quantity: string;
  side: B2C2OrderSide;
  order_type: B2C2OrderType;
  created: Date;
}

export class B2C2GetCryptoRemittanceByIdGateway
  implements Pick<CryptoRemittanceGateway, 'getCryptoRemittanceById'>
{
  constructor(
    private readonly logger: Logger,
    private readonly axios: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: B2C2GetCryptoRemittanceByIdGateway.name,
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
      const response = await this.axios.get<
        B2C2GetOrderByIdConversionResponse[]
      >(`${B2C2_SERVICES.ORDER}/${providerOrderId}`);

      this.logger.debug('Response found.', { data: response.data });

      if (!response.data?.length) return null;

      const [result] = response.data;

      const executedPrice =
        result.executed_price &&
        formatValueFromFloatToInt(
          result.executed_price,
          market.priceSignificantDigits,
        );

      const executedQuantity =
        result.quantity &&
        formatValueFromFloatToInt(result.quantity, baseCurrency.decimal);

      let status = CryptoRemittanceStatus.FILLED;

      // The order is either filled in its entirety or not executed (executed_price=null).
      if (!executedPrice) {
        // TODO: Verificar o comportamento em caso de problemas com a execução
        status = CryptoRemittanceStatus.WAITING;
      }

      return {
        id: result.client_order_id,
        providerOrderId,
        providerName: B2C2_PROVIDER_NAME,
        status,
        executedPrice,
        executedQuantity,
      };
    } catch (error) {
      this.logger.error('Unexpected B2C2 gateway error.', {
        error: error.isAxiosError ? error.message : error,
        request: error.config,
        response: error.response?.data ?? error.response ?? error,
      });
      throw new CryptoRemittanceGatewayException(error);
    }
  }
}
