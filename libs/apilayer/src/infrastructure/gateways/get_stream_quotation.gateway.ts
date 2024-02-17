import { Logger } from 'winston';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { v4 as uuidV4 } from 'uuid';
import { Currency } from '@zro/operations/domain';
import { APILAYER_SERVICES } from './services.constants';
import {
  GetStreamQuotationGateway,
  GetStreamQuotationGatewayRequest,
  GetStreamQuotationGatewayResponse,
} from '@zro/quotations/application';

type ApiLayerGetStreamQuotationResponse = {
  success: boolean;
  terms: string;
  privacy: string;
  timestamp: number;
  base: string;
  quotes: { [key: string]: number };
};

export class ApiLayerGetStreamQuotationGateway
  implements GetStreamQuotationGateway
{
  private readonly logger: Logger;
  private readonly baseURL: string;
  private readonly accessKey: string;
  private readonly apiLayer: AxiosInstance;

  public static PROVIDER = 'APILAYER';
  private quoteCurrencies: Currency[] = [];

  constructor({
    logger,
    baseURL,
    accessKey,
  }: {
    logger: Logger;
    baseURL: string;
    accessKey: string;
  }) {
    this.logger = logger.child({
      context: ApiLayerGetStreamQuotationGateway.name,
    });

    this.baseURL = baseURL;
    this.accessKey = accessKey;

    this.apiLayer = axios.create({ baseURL: this.baseURL });
  }

  /**
   * Set quote currencies.
   */
  setQuoteCurrencies(currencies: Currency[] = []) {
    // Sanity check.
    this.quoteCurrencies = currencies.filter(
      (quoteCurrency) => quoteCurrency.symbol,
    );
  }

  start() {
    this.logger.info('Service started.');
  }

  stop() {
    this.logger.info('Service stopped.');
  }

  getProviderName(): string {
    return ApiLayerGetStreamQuotationGateway.PROVIDER;
  }

  hasOrderService(): boolean {
    return false;
  }

  async getQuotation(
    request: GetStreamQuotationGatewayRequest,
  ): Promise<GetStreamQuotationGatewayResponse[]> {
    // Data input check
    if (!request?.baseCurrencies?.length) {
      this.logger.warn('No currencies symbols found.');
      return [];
    }

    const quotations = await Promise.all(
      this.quoteCurrencies.map((quoteCurrency) =>
        this.getApilayerQuotation(request, quoteCurrency),
      ),
    );

    return quotations.flat();
  }

  private async getApilayerQuotation(
    request: GetStreamQuotationGatewayRequest,
    quoteCurrency: Currency,
  ): Promise<GetStreamQuotationGatewayResponse[]> {
    let response: AxiosResponse<ApiLayerGetStreamQuotationResponse> = null;
    try {
      response = await this.apiLayer.get<ApiLayerGetStreamQuotationResponse>(
        APILAYER_SERVICES.LIVE,
        {
          params: {
            access_key: this.accessKey,
            source: quoteCurrency.symbol,
            currencies: request.baseCurrencies
              .map((currency) => currency.symbol)
              .join(','),
            format: 1,
          },
        },
      );
    } catch (error) {
      this.logger.error("Can't access api.", { error: error.message });
      return [];
    }

    if (!response?.data?.success || !response.data?.quotes) {
      this.logger.warn('No quotes found.', { data: response?.data });
      return [];
    }

    const quotations = Object.entries(
      response.data.quotes,
    ).map<GetStreamQuotationGatewayResponse>(([key, value]) => ({
      id: uuidV4(),
      baseCurrency: request.baseCurrencies.find(
        (currency) => currency.symbol === key.replace(quoteCurrency.symbol, ''),
      ),
      quoteCurrency,
      gatewayName: ApiLayerGetStreamQuotationGateway.PROVIDER,
      buy: 1 / value,
      sell: 1 / value,
      amount: 1,
      timestamp: new Date(
        (response.data.timestamp && response.data.timestamp * 1000) ??
          Date.now(),
      ),
    }));

    return quotations;
  }
}
