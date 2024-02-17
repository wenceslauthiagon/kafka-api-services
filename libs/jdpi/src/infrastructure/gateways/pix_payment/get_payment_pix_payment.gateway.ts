import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { HttpStatus } from '@nestjs/common';
import { MissingDataException } from '@zro/common';
import {
  JdpiAccountType,
  JdpiAgentModalityType,
  JdpiAgentType,
  JdpiErrorTypes,
  JdpiLaunchSituation,
  JdpiLaunchType,
  JdpiPaymentPriorityType,
  JdpiPaymentPriorityLevelType,
  JdpiPersonType,
  JdpiFinalityType,
  JdpiPaymentType,
  JdpiErrorCode,
} from '@zro/jdpi/domain';
import {
  GetPaymentPixPaymentPspRequest,
  GetPaymentPixPaymentPspResponse,
  OfflinePixPaymentPspException,
  PixPaymentGateway,
  PixPaymentPspException,
} from '@zro/pix-payments/application';
import {
  JdpiAuthGateway,
  Sanitize,
  JDPI_SERVICES,
  JdpiLaunchSituationException,
} from '@zro/jdpi/infrastructure';

interface JdpiGetPaymentPixPaymentRequest {
  endToEndId: string;
}

interface JdpiGetPaymentPixPaymentResponse {
  endToEndId: string;
  endToEndIdOriginal?: string;
  ispbPspDireto: number;
  tpLanc: JdpiLaunchType;
  stLanc: JdpiLaunchSituation;
  dtHrSituacao?: string;
  nomeMsgOrigem: string;
  tpIniciacao: JdpiPaymentType;
  prioridadePagamento: JdpiPaymentPriorityType;
  tpPrioridadePagamento: JdpiPaymentPriorityLevelType;
  finalidade: JdpiFinalityType;
  modalidadeAgente?: JdpiAgentModalityType;
  ispbPss?: number;
  cnpjIniciadorPagamento?: string;
  tpAgente?: JdpiAgentType;
  ispbOrigemLanc?: number;
  valor: number;
  vlrDetalhe?: {
    vlrTarifaDinheiroCompra: number;
    tipo: number;
  }[];
  pagador?: {
    ispb?: number;
    tpPessoa: JdpiPersonType;
    cpfCnpj: number;
    nome: string;
    nrAgencia?: string;
    tpConta: JdpiAccountType;
    nrConta: string;
  };
  recebedor?: {
    ispb?: number;
    tpPessoa: JdpiPersonType;
    cpfCnpj: number;
    nrAgencia?: string;
    tpConta: JdpiAccountType;
    nrConta: string;
  };
  dataContabil?: string;
  chave?: string;
  idConciliacaoRecebedor?: string;
  infEntreClientes?: string;
  codigoDevolucao: string;
  motivoDevolucao?: string;
  codigoErro?: string;
  detalheCodigoErro?: string;
}

export class JdpiGetPaymentPixPaymentPspGateway
  implements Pick<PixPaymentGateway, 'getPayment'>
{
  constructor(
    private readonly logger: Logger,
    private readonly axios: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: JdpiGetPaymentPixPaymentPspGateway.name,
    });
  }

  async getPayment(
    request: GetPaymentPixPaymentPspRequest,
  ): Promise<GetPaymentPixPaymentPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const params: JdpiGetPaymentPixPaymentRequest = {
      endToEndId: request.endToEndId,
    };

    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
    };

    this.logger.info('Request payload.', { params });

    try {
      const response = await this.axios.get<JdpiGetPaymentPixPaymentResponse>(
        `${JDPI_SERVICES.PIX_PAYMENT.PAYMENT_LIST}/${params.endToEndId}`,
        { headers },
      );

      this.logger.info('Response found.', { data: response.data });

      return {
        id: request.id,
        status: Sanitize.getPaymentStatusType(response.data.stLanc),
        reason: response.data.codigoErro,
        endToEndId: response.data.endToEndId,
        errorCode:
          response.data.codigoErro && JdpiErrorCode[response.data.codigoErro],
      };
    } catch (error) {
      this.logger.debug('ERROR Jdpi request.', {
        error: error.isAxiosError ? error.message : error,
      });

      if (error instanceof JdpiLaunchSituationException) {
        throw error;
      }

      if (error?.response?.data) {
        if (error.response.status === HttpStatus.NOT_FOUND) {
          return null;
        }

        this.logger.error('ERROR Jdpi response data.', {
          error: error.response.data,
          status: error.response.status,
        });

        const { codigo } = error?.response?.data;

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
