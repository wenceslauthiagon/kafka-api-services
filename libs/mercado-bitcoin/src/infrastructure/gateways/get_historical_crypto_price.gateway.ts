import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import {
  formatValueFromFloatToInt,
  MissingDataException,
  getMoment,
} from '@zro/common';
import {
  HistoricalCryptoPriceGatewayException,
  NotFoundHistoricalCryptoPriceGatewayException,
  OfflineHistoricalCryptoPriceGatewayException,
} from '@zro/otc/application';
import { HttpStatus } from '@nestjs/common';
import { Currency } from '@zro/operations/domain';

interface MercadoBitcoinGetHistoricalCryptoPriceRequest {
  currency: Currency;
  createdAt: Date;
}

interface MercadoBitcoinGetHistoricalCryptoPriceResponse {
  estimatedPrice: number;
}

interface MercadoBitcoinGetHistoricalCryptoPriceAxiosResponse {
  date: string;
  opening: number;
  closing: number;
  lowest: number;
  highest: number;
  volume: string;
  quantity: string;
  amount: number;
  avg_price: number;
}

export class MercadoBitcoinGetHistoricalCryptoPriceGateway {
  constructor(
    private readonly logger: Logger,
    private readonly axios: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: MercadoBitcoinGetHistoricalCryptoPriceGateway.name,
    });
  }

  async getHistoricalCryptoPrice(
    request: MercadoBitcoinGetHistoricalCryptoPriceRequest,
  ): Promise<MercadoBitcoinGetHistoricalCryptoPriceResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException([
        'Missing data on getting historical price.',
      ]);
    }

    const { currency, createdAt } = request;

    const day = getMoment(createdAt).date();
    const month = getMoment(createdAt).month() + 1;
    const year = getMoment(createdAt).year();

    try {
      const response =
        await this.axios.get<MercadoBitcoinGetHistoricalCryptoPriceAxiosResponse>(
          `/${currency.symbol}/day-summary/${year}/${month}/${day}/`,
        );

      this.logger.debug('Response found.', { data: response.data });

      const avgPrice = response.data.avg_price;

      const estimatedPrice = avgPrice && formatValueFromFloatToInt(avgPrice, 2);

      return {
        estimatedPrice,
      };
    } catch (error) {
      this.logger.error('Unexpected Mercado Bitcoin gateway error', {
        error: error.isAxiosError ? error.message : error,
        request: error.config,
        response: error.response?.data ?? error.response ?? error,
      });

      if (
        error.isAxiosError &&
        error.response.status === HttpStatus.NOT_FOUND &&
        error.response.data
      ) {
        throw new NotFoundHistoricalCryptoPriceGatewayException(
          error.response.data,
        );
      } else if (error.isAxiosError && error.response.status >= 500) {
        throw new OfflineHistoricalCryptoPriceGatewayException(
          error.response.data,
        );
      } else {
        throw new HistoricalCryptoPriceGatewayException(error);
      }
    }
  }
}
