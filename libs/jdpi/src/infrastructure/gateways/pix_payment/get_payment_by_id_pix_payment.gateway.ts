import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { isDefined } from 'class-validator';
import { MissingDataException } from '@zro/common';
import {
  JdpiAccountType,
  JdpiAgentModalityType,
  JdpiErrorCode,
  JdpiErrorTypes,
  JdpiFinalityType,
  JdpiPaymentPriorityLevelType,
  JdpiPaymentPriorityType,
  JdpiPaymentProcessSituation,
  JdpiPaymentStatus,
  JdpiPaymentType,
  JdpiPersonType,
} from '@zro/jdpi/domain';
import {
  GetPaymentByIdPixPaymentPspRequest,
  GetPaymentByIdPixPaymentPspResponse,
  OfflinePixPaymentPspException,
  PixPaymentGateway,
  PixPaymentPspException,
} from '@zro/pix-payments/application';
import {
  JdpiAuthGateway,
  JDPI_SERVICES,
  Sanitize,
} from '@zro/jdpi/infrastructure';

export interface JdpiGetPaymentByIdPixPaymentRequest {
  idReqJdPiConsultada: string;
  chaveIdempotenciaConsultada?: string; // Obligatory when the payment is active. The value must be the same as the "Chave-Idempotencia" used on the payment creation.
}

export interface JdpiPersonResponse {
  ispb: number;
  tpPessoa: JdpiPersonType;
  cpfCnpj: number;
  nome: string;
  nrAgencia?: string;
  tpConta: JdpiAccountType;
  nrConta: string;
}

export interface JdpiGetPaymentByIdPixPaymentResponse {
  idReqJdPiConsultada: string;
  dtHrReqJdPi: string;
  dtHrSituacao: string;
  stJdPi: JdpiPaymentStatus;
  stJdPiProc: JdpiPaymentProcessSituation;
  endToEndId?: string;
  dtHrEfetivacao?: string;
  tpIniciacao: JdpiPaymentType;
  pagador: JdpiPersonResponse;
  recebedor: JdpiPersonResponse;
  prioridadePagamento: JdpiPaymentPriorityType;
  tpPrioridadePagamento: JdpiPaymentPriorityLevelType;
  finalidade: JdpiFinalityType;
  valor: number;
  vlrDetalhe?: any[];
  infEntreClientes: string;
  codigoErro?: string;
  descCodigoErro?: string;
  modalidadeAgente?: JdpiAgentModalityType;
  ispbPss?: number;
  cnpjIniciadorPagamento?: number;
}

export class JdpiGetPaymentByIdPixPaymentPspGateway
  implements Pick<PixPaymentGateway, 'getPaymentById'>
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: JdpiGetPaymentByIdPixPaymentPspGateway.name,
    });
  }

  async getPaymentById(
    request: GetPaymentByIdPixPaymentPspRequest,
  ): Promise<GetPaymentByIdPixPaymentPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const payload: JdpiGetPaymentByIdPixPaymentRequest = {
      idReqJdPiConsultada: request.externalId,
      chaveIdempotenciaConsultada: request.id,
    };

    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
    };

    this.logger.info('Request payload.', { payload });

    try {
      const response =
        await this.axios.get<JdpiGetPaymentByIdPixPaymentResponse>(
          `${JDPI_SERVICES.PIX_PAYMENT.PAYMENT}/${request.externalId}`,
          { headers },
        );

      this.logger.info('Response found.', { data: response.data });

      return {
        id: request.id,
        status:
          isDefined(response.data.stJdPi) &&
          Sanitize.parsePaymentStatusType(response.data.stJdPi),
        reason: response.data.codigoErro,
        endToEndId: response.data.endToEndId,
        errorCode:
          response.data.codigoErro && JdpiErrorCode[response.data.codigoErro],
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
            throw new OfflinePixPaymentPspException(error);
          default: // AuthorizationError, InternalServerError
        }
      }

      this.logger.error('Unexpected Jdpi gateway error', {
        error: error.isAxiosError ? error.message : error,
        request: error.config,
        response: error.response?.data ?? error.response ?? error,
      });
      throw new PixPaymentPspException(error);
    }
  }
}
