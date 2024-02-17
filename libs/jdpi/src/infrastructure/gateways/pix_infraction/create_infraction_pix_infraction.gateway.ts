import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { isDefined } from 'class-validator';
import { MissingDataException } from '@zro/common';
import {
  CreateInfractionPixInfractionPspRequest,
  CreateInfractionPixInfractionPspResponse,
  OfflinePixPaymentPspException,
  PixPaymentPspException,
  CreateInfractionPixInfractionPspGateway,
} from '@zro/pix-payments/application';
import {
  JdpiAuthGateway,
  JDPI_SERVICES,
  Sanitize,
} from '@zro/jdpi/infrastructure';
import {
  JdpiErrorTypes,
  JdpiPixInfractionStatus,
  JdpiPixInfractionReason,
  JdpiPixInfractionType,
} from '@zro/jdpi/domain';
import { PixInfractionType } from '@zro/pix-payments/domain';

interface JdpiCreateInfractionPixInfractionPspRequest {
  ispb: number;
  endToEndId: string;
  motivo: JdpiPixInfractionType;
  tpSitOrigem: JdpiPixInfractionReason; // If "motivo" is "2 - Cancelamento da devolução", it must be fulfilled with "4 - Outros".
  detalhes?: string; // Obligatory when "tpSitOrigem" is "4".
}

interface JdpiCreateInfractionPixInfractionPspResponse {
  idRelatoInfracao: string;
  stRelatoInfracao: JdpiPixInfractionStatus;
  pspCriador: number;
  pspContraParte: number;
  dtHrCriacaoRelatoInfracao: string;
  dtHrUltModificacao: string;
}

export class JdpiCreateInfractionPixInfractionPspGateway
  implements CreateInfractionPixInfractionPspGateway
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
    private pspIspb: number,
  ) {
    this.logger = logger.child({
      context: JdpiCreateInfractionPixInfractionPspGateway.name,
    });
  }

  async createInfraction(
    request: CreateInfractionPixInfractionPspRequest,
  ): Promise<CreateInfractionPixInfractionPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const payload: JdpiCreateInfractionPixInfractionPspRequest = {
      ispb: this.pspIspb,
      endToEndId: request.operationTransactionEndToEndId,
      motivo: Sanitize.parseJdpiPixInfractionType(request.infractionType),
      tpSitOrigem:
        request.infractionType === PixInfractionType.CANCEL_DEVOLUTION
          ? JdpiPixInfractionReason.OTHER
          : JdpiPixInfractionReason.FRAUD,
      ...((request.reportDetails ||
        request.infractionType === PixInfractionType.CANCEL_DEVOLUTION) && {
        detalhes: request.reportDetails,
      }),
    };

    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
      'Chave-Idempotencia': request.operationTransactionId,
    };

    this.logger.info('Request payload and headers.', { payload });

    try {
      const response =
        await this.axios.post<JdpiCreateInfractionPixInfractionPspResponse>(
          JDPI_SERVICES.PIX_INFRACTION.CREATE,
          payload,
          { headers },
        );

      this.logger.info('Response found.', { data: response.data });

      return {
        infractionId: response.data.idRelatoInfracao,
        infractionType: request.infractionType,
        reportedBy: request.reportBy,
        status:
          isDefined(response.data.stRelatoInfracao) &&
          Sanitize.getInfractionStatus(response.data.stRelatoInfracao),
        debitedParticipant:
          isDefined(response.data.pspCriador) &&
          Sanitize.getIspb(response.data.pspCriador),
        creditedParticipant:
          isDefined(response.data.pspContraParte) &&
          Sanitize.getIspb(response.data.pspContraParte),
        reportDetails: request.reportDetails,
        operationTransactionId: request.operationTransactionId,
      };
    } catch (error) {
      this.logger.error('ERROR Jdpi request.', {
        error: error.isAxiosError ? error.message : error,
      });

      if (error.response?.data?.codigo) {
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
