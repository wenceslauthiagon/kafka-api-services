import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { ExchangeQuotationState } from '@zro/otc/domain';
import {
  GetExchangeQuotationByPspIdRequest,
  GetExchangeQuotationByPspIdResponse,
  ExchangeQuotationGateway,
  ExchangeQuotationPspException,
  ExchangeQuotationNotFoundPspException,
} from '@zro/otc/application';
import {
  TopazioAuthGateway,
  TOPAZIO_SERVICES,
  Sanitize,
} from '@zro/topazio/infrastructure';

enum TopazioExchangeQuotationState {
  CANCELED = 0,
  CREATED = 1,
  ACCEPTED = 2,
  APPROVED = 4,
  BILLED = 5,
}

const stateMapper = {
  [TopazioExchangeQuotationState.CANCELED]: ExchangeQuotationState.CANCELED,
  [TopazioExchangeQuotationState.CREATED]: ExchangeQuotationState.PENDING,
  [TopazioExchangeQuotationState.ACCEPTED]: ExchangeQuotationState.ACCEPTED,
  [TopazioExchangeQuotationState.APPROVED]: ExchangeQuotationState.APPROVED,
  [TopazioExchangeQuotationState.BILLED]: ExchangeQuotationState.COMPLETED,
};

interface TopazioGetExchangeQuotationByIdRequest {
  id: string;
}

interface TopazioGetExchangeQuotationByIdResponseItem {
  id: string;
  status: number;
  operation: string;
  internalSettlementDate: Date;
  externalSettlementDate: Date;
  createdDate: Date;
  expiredDate: Date;
  timeExpired: number;
  quotationId: string;
  fxRate: number;
  internalValue: number;
  externalValue: number;
  lastAuthorizedUser: string;
}

interface TopazioGetExchangeQuotationByIdResponse {
  resultSet: TopazioGetExchangeQuotationByIdResponseItem[];
  page: number;
  perPage: number;
  totalRegisters: number;
  totalPages: number;
}

export enum TopazioExchangeQuotationError {
  ERROR = 'QTM',
}

export class TopazioGetExchangeQuotationByIdGateway
  implements Pick<ExchangeQuotationGateway, 'getExchangeQuotationById'>
{
  private readonly PAGE = 1;
  private readonly LIMIT = 100;

  constructor(
    private readonly logger: Logger,
    private readonly axios: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: TopazioGetExchangeQuotationByIdGateway.name,
    });
  }

  async getExchangeQuotationById(
    request: GetExchangeQuotationByPspIdRequest,
  ): Promise<GetExchangeQuotationByPspIdResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const param: TopazioGetExchangeQuotationByIdRequest = {
      id: request.solicitationPspId,
    };

    const headers = {
      access_token: await TopazioAuthGateway.getAccessToken(this.logger),
      page: this.PAGE,
      per_page: this.LIMIT,
    };

    this.logger.info('Request payload.', { param });

    try {
      const response =
        await this.axios.get<TopazioGetExchangeQuotationByIdResponse>(
          `${TOPAZIO_SERVICES.EXCHANGE_QUOTATION.TRADE}/${param.id}`,
          { headers },
        );

      this.logger.info('Topazio get exchange quotation by id response found.', {
        data: response.data,
      });

      if (!response?.data?.resultSet?.length) return;

      // Response is paginated, so get first one.
      const [result] = response.data.resultSet;

      return {
        id: result.id,
        status: stateMapper[result.status],
        quotationId: result.quotationId,
        operation: result.operation,
        internalSettlementDate: result.internalSettlementDate,
        externalSettlementDate: result.externalSettlementDate,
        createdDate: result.createdDate,
        expiredDate: result.expiredDate,
        timeExpired: result.timeExpired,
        fxRate: Sanitize.toInt(result.fxRate || 0),
        internalValue: Sanitize.toInt(result.internalValue || 0),
        externalValue: Sanitize.toInt(result.externalValue || 0),
        lastAuthorizedUser: result.lastAuthorizedUser,
      };
    } catch (error) {
      this.logger.error('ERROR Topazio request.', {
        error: error.isAxiosError ? error.message : error,
      });

      if (error.response?.data) {
        const errorData = error.response.data;

        this.logger.error('ERROR Topazio response data.', { error: errorData });

        if (
          errorData.codeError?.startsWith(TopazioExchangeQuotationError.ERROR)
        ) {
          throw new ExchangeQuotationNotFoundPspException(error);
        }
      }

      this.logger.error('Unexpected Topazio gateway error', {
        error: error.isAxiosError ? error.message : error,
        request: error.config,
        response: error.response?.data ?? error.response ?? error,
      });
      throw new ExchangeQuotationPspException(error);
    }
  }
}
