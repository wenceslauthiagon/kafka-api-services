import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { MissingDataException } from '@zro/common';
import {
  JdpiErrorCode,
  JdpiErrorTypes,
  JdpiResultType,
} from '@zro/jdpi/domain';
import {
  VerifyNotifyCreditPixStatementPspGateway,
  VerifyNotifyCreditPixStatementPspRequest,
  VerifyNotifyCreditPixStatementPspResponse,
  OfflinePixStatementException,
  PixStatementException,
} from '@zro/api-jdpi/application';
import {
  JdpiAuthGateway,
  Sanitize,
  JDPI_SERVICES,
} from '@zro/jdpi/infrastructure';

interface JdpiVerifyNotifyCreditPixStatementPspRequest {
  idValidacaoSgct: string;
  endToEndId: string;
  resultado: JdpiResultType;
  motivo?: JdpiErrorCode;
  motivoComplemento?: string;
  dtHrValidacao: Date;
}

export interface JdpiVerifyNotifyCreditPixStatementPspResponse {
  endToEndId: string;
  dtHrReqJdPi: string;
}

export class JdpiVerifyNotifyCreditPixStatementPspGateway
  implements
    Pick<
      VerifyNotifyCreditPixStatementPspGateway,
      'verifyNotifyCreditPixStatement'
    >
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: JdpiVerifyNotifyCreditPixStatementPspGateway.name,
    });
  }

  async verifyNotifyCreditPixStatement(
    request: VerifyNotifyCreditPixStatementPspRequest,
  ): Promise<VerifyNotifyCreditPixStatementPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const payload: JdpiVerifyNotifyCreditPixStatementPspRequest = {
      idValidacaoSgct: request.groupId,
      endToEndId: request.endToEndId,
      resultado: Sanitize.parseResultType(request.resultType),
      ...(request.devolutionCode && { motivo: request.devolutionCode }),
      ...(request.description && { motivoComplemento: request.description }),
      dtHrValidacao: request.createdAt,
    };

    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
      'Chave-Idempotencia': request.id,
    };

    this.logger.info('Request payload and headers.', {
      payload,
      headers: { 'Chave-Idempotencia': request.id },
    });

    try {
      const response =
        await this.axios.post<JdpiVerifyNotifyCreditPixStatementPspResponse>(
          JDPI_SERVICES.PIX_PAYMENT.VERIFY_NOTIFY_CREDIT_STATEMENT,
          payload,
          { headers },
        );

      this.logger.info('Response found.', { data: response.data });

      return {
        endToEndId: response.data.endToEndId,
        createdAt: new Date(response.data.dtHrReqJdPi),
      };
    } catch (error) {
      this.logger.error('ERROR Jdpi request.', {
        error: error.isAxiosError ? error.message : error,
      });

      if (error.response?.data) {
        this.logger.error('ERROR Jdpi response data.', {
          error: error.response.data,
        });

        const { codigo } = error.response.data;

        switch (codigo) {
          case JdpiErrorTypes.INTERNAL_SERVER_ERROR:
          case JdpiErrorTypes.SERVICE_UNAVAILABLE:
            throw new OfflinePixStatementException(error);
          default: // AuthorizationError, InternalServerError
        }
      }

      this.logger.error('Unexpected Jdpi gateway error', {
        error: error.isAxiosError ? error.message : error,
        request: error.config,
        response: error.response?.data ?? error.response ?? error,
      });
      throw new PixStatementException(error);
    }
  }
}
