import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import {
  formatToYearMonthDay,
  formatValueFromIntToFloat,
  MissingDataException,
} from '@zro/common';
import {
  CreateExchangeQuotationRequest,
  CreateExchangeQuotationResponse,
  ExchangeQuotationGateway,
  ExchangeQuotationPspException,
  OfflineExchangeQuotationPspException,
} from '@zro/otc/application';
import { RemittanceSide } from '@zro/otc/domain';
import {
  TopazioAuthGateway,
  TOPAZIO_SERVICES,
  Sanitize,
} from '@zro/topazio/infrastructure';

enum TopazioOperationType {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

const operationTypeMapper = {
  [RemittanceSide.BUY]: TopazioOperationType.OUTBOUND,
  [RemittanceSide.SELL]: TopazioOperationType.INBOUND,
};

interface TopazioCreateExchangeQuotationRequest {
  partnerId: number;
  operation: TopazioOperationType;
  currency: string;
  externalValue: number;
  internalSettlementDate: string;
  externalSettlementDate: string;
}

interface TopazioCreateExchangeQuotationResponse {
  resultSet: {
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
    partnerId: number;
  };
}

export class TopazioCreateExchangeQuotationGateway
  implements Pick<ExchangeQuotationGateway, 'createExchangeQuotation'>
{
  public static PROVIDER = 'TOPAZIO';

  constructor(
    private readonly logger: Logger,
    private readonly axios: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: TopazioCreateExchangeQuotationGateway.name,
    });
  }

  async createExchangeQuotation(
    request: CreateExchangeQuotationRequest,
  ): Promise<CreateExchangeQuotationResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const payload: TopazioCreateExchangeQuotationRequest = {
      partnerId: request.zroBankPartnerId,
      operation: operationTypeMapper[request.side],
      currency: request.currencyTag,
      externalValue: formatValueFromIntToFloat(request.amount),
      internalSettlementDate: formatToYearMonthDay(request.sendDate),
      externalSettlementDate: formatToYearMonthDay(request.receiveDate),
    };

    const headers = {
      access_token: await TopazioAuthGateway.getAccessToken(this.logger),
    };

    this.logger.info('Request payload.', { payload });

    try {
      const response =
        await this.axios.post<TopazioCreateExchangeQuotationResponse>(
          TOPAZIO_SERVICES.EXCHANGE_QUOTATION.TRADE,
          payload,
          { headers },
        );

      this.logger.info('Topazio exchange quotation response found.', {
        data: response.data,
      });

      return {
        id: response.data.resultSet?.id,
        status: response.data.resultSet?.status,
        operation: response.data.resultSet?.operation,
        internalSettlementDate: response.data.resultSet?.internalSettlementDate,
        externalSettlementDate: response.data.resultSet?.externalSettlementDate,
        createdDate: response.data.resultSet?.createdDate,
        expiredDate: response.data.resultSet?.expiredDate,
        timeExpired: response.data.resultSet?.timeExpired,
        quotationId: response.data.resultSet?.quotationId,
        fxRate: Sanitize.toInt(response.data.resultSet?.fxRate || 0, 4), // to ten-thousandths.
        internalValue: Sanitize.toInt(
          response.data.resultSet?.internalValue || 0,
        ),
        externalValue: Sanitize.toInt(
          response.data.resultSet?.externalValue || 0,
        ),
        gatewayName: TopazioCreateExchangeQuotationGateway.PROVIDER,
      };
    } catch (error) {
      this.logger.error('ERROR Topazio request.', {
        error: error.isAxiosError ? error.message : error,
      });

      const parseMessage = (message: string) => {
        if (!message) return;

        if (message.startsWith('An error occurred while sending the request')) {
          throw new OfflineExchangeQuotationPspException(error);
        } else if (message.startsWith('No such host is known')) {
          throw new OfflineExchangeQuotationPspException(error);
        }
      };

      if (error.response?.data) {
        this.logger.error('ERROR Topazio response data.', {
          error: error.response.data,
        });

        const { type, message, errors } = error.response.data;
        switch (type) {
          case 'ValidationError':
            const messages = Array.isArray(errors)
              ? errors.map((e) => e.message)
              : [message];

            messages.forEach(parseMessage);
            break;
          default: // AuthorizationError, NotFoundError, InternalServerError
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
