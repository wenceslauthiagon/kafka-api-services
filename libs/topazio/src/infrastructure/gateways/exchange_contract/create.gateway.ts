import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  CreateExchangeContractRequest,
  CreateExchangeContractResponse,
  ExchangeContractGateway,
  ExchangeContractPspException,
  OfflineExchangeContractPspException,
} from '@zro/otc/application';
import {
  TopazioAuthGateway,
  TOPAZIO_SERVICES,
} from '@zro/topazio/infrastructure';

interface TopazioCreateExchangeContractRequest {
  tradeIds: string[];
  externalName: string;
  externalIban: string;
  externalAddress: string;
  intermBankSwift?: string;
  intermBankCity?: string;
  intermBankName?: string;
  intermBankAba?: string;
  receiverBankSwift: string;
  receiverBankCity: string;
  receiverBankAba?: string;
  receiverBankName: string;
  nature: number;
  country: number;
  averageBankFxRate?: number;
  averageFxRate?: number;
  averageSpot?: number;
  clientReference?: string;
}

interface TopazioCreateExchangeContractResponse {
  resultSet: {
    id: string;
    intermBankSwift: string;
    receiverBankSwift: string;
    receiverBankCity: string;
    externalName: string;
    externalAddress: string;
    externalIban: string;
    internalDocument: string;
    internalSettlementDate: Date;
    externalSettlementDate: Date;
    nature: number;
    fxRate: number;
    internalValue: number;
    externalValue: number;
    iofValue: number;
    createdDate: Date;
    country: number;
    status: string;
    tradeIds: string[];
  };
}

export class TopazioCreateExchangeContractGateway
  implements Pick<ExchangeContractGateway, 'createExchangeContract'>
{
  constructor(
    private readonly logger: Logger,
    private readonly axios: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: TopazioCreateExchangeContractGateway.name,
    });
  }

  async createExchangeContract(
    request: CreateExchangeContractRequest,
  ): Promise<CreateExchangeContractResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const payload: TopazioCreateExchangeContractRequest = {
      tradeIds: request.tradeIds,
      externalName: request.externalName,
      externalIban: request.externalIban,
      externalAddress: request.externalAddress,
      intermBankSwift: request.intermBankSwift,
      intermBankCity: request.intermBankCity,
      intermBankName: request.intermBankName,
      intermBankAba: request.intermBankAba,
      receiverBankSwift: request.receiverBankSwift,
      receiverBankCity: request.receiverBankCity,
      receiverBankAba: request.receiverBankAba,
      receiverBankName: request.receiverBankName,
      nature: request.nature,
      country: request.country,
      averageBankFxRate: request.averageBankFxRate,
      averageFxRate: request.averageFxRate,
      averageSpot: request.averageSpot,
      clientReference: request.clientReference,
    };

    const headers = {
      access_token: await TopazioAuthGateway.getAccessToken(this.logger),
    };

    this.logger.info('Request payload.', { payload });

    try {
      const response =
        await this.axios.post<TopazioCreateExchangeContractResponse>(
          TOPAZIO_SERVICES.EXCHANGE_CONTRACT.CONTRACT,
          payload,
          { headers },
        );

      this.logger.info('Topazio exchange contract response.', {
        data: response.data,
      });

      const result = response.data.resultSet;

      return {
        id: result.id,
        intermBankSwift: result.intermBankSwift,
        receiverBankSwift: result.receiverBankSwift,
        externalName: result.externalName,
        externalAddress: result.externalAddress,
        externalIban: result.externalIban,
        internalDocument: result.internalDocument,
        internalSettlementDate: result.internalSettlementDate,
        externalSettlementDate: result.externalSettlementDate,
        nature: result.nature,
        fxRate: result.fxRate,
        country: result.country,
        createdDate: result.createdDate,
        externalValue: result.externalValue,
        internalValue: result.internalValue,
        iofValue: result.iofValue,
        receiverBankCity: result.receiverBankCity,
        status: result.status,
        tradeIds: result.tradeIds,
      };
    } catch (error) {
      this.logger.error('ERROR Topazio request.', {
        error: error.isAxiosError ? error.message : error,
      });

      const parseMessage = (message: string) => {
        if (!message) return;

        if (message.startsWith('An error occurred while sending the request')) {
          throw new OfflineExchangeContractPspException(error);
        } else if (message.startsWith('No such host is known')) {
          throw new OfflineExchangeContractPspException(error);
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
      throw new ExchangeContractPspException(error);
    }
  }
}
