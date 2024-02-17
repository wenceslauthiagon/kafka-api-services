import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  OfflinePixPaymentPspException,
  PixPaymentPspException,
  CancelPixRefundPspGateway,
  CancelPixRefundPspRequest,
  CancelPixRefundPspResponse,
} from '@zro/pix-payments/application';
import {
  JdpiAuthGateway,
  JDPI_SERVICES,
  Sanitize,
} from '@zro/jdpi/infrastructure';
import {
  JdpiErrorTypes,
  JdpiPixRefundAnalysisResult,
  JdpiPixRefundReasonType,
  JdpiPixRefundRejectionReason,
  JdpiPixRefundStatus,
} from '@zro/jdpi/domain';

interface JdpiCancelPixRefundRequest {
  idSolDevolucao: string;
  ispb: number;
  resultadoAnalise: JdpiPixRefundAnalysisResult;
  detalhesAnalise?: string;
  motivoRejeicao?: JdpiPixRefundRejectionReason; // Obligatory when "resultadoAnalise" is "2 - Rejeitada".
}

export interface JdpiCancelPixRefundResponse {
  dtHrRespostaDict: string;
  idCorrelacaoDict: string;
  endToEndId: string;
  motivo: JdpiPixRefundReasonType;
  idSolDevolucao: string;
  idRelatoInfracao?: string;
  stSolDevolucao: JdpiPixRefundStatus; // Should be 2 = CLOSED
  ispbSolicitante: number;
  ispbContestado: number;
  dtHrCriacaoSolDevolucao: string;
  dtHrUltModificacao: string;
}

export class JdpiCancelPixRefundPspGateway
  implements Pick<CancelPixRefundPspGateway, 'cancelRefundRequest'>
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
    private pspIspb: number,
  ) {
    this.logger = logger.child({
      context: JdpiCancelPixRefundPspGateway.name,
    });
  }

  async cancelRefundRequest(
    request: CancelPixRefundPspRequest,
  ): Promise<CancelPixRefundPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const payload: JdpiCancelPixRefundRequest = {
      idSolDevolucao: request.solicitationPspId,
      ispb: this.pspIspb,
      resultadoAnalise: Sanitize.parseJdpiPixRefundAnalysisResult(
        request.status,
      ),
      motivoRejeicao: Sanitize.parseJdpiPixRefundRejectionReason(
        request.rejectionReason,
      ),
      ...(request.analisysDetails && {
        detalhesAnalise: request.analisysDetails,
      }),
    };

    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
      'Chave-Idempotencia': request.solicitationPspId,
    };

    this.logger.info('Request payload.', { payload });

    try {
      const response = await this.axios.post<JdpiCancelPixRefundResponse>(
        JDPI_SERVICES.PIX_REFUND.CANCEL,
        payload,
        { headers },
      );

      this.logger.info('Response found.', { data: response.data });

      return {
        solicitationPspId: response.data.idSolDevolucao,
        status:
          response.data.stSolDevolucao &&
          Sanitize.parsePixRefundStatus(response.data.stSolDevolucao),
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
