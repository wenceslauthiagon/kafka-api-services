import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { isDefined } from 'class-validator';
import { MissingDataException } from '@zro/common';
import {
  OfflinePixPaymentPspException,
  PixPaymentPspException,
  ClosePixRefundPspGateway,
  ClosePixRefundPspRequest,
  ClosePixRefundPspResponse,
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
  JdpiPixRefundStatus,
} from '@zro/jdpi/domain';

interface JdpiClosePixRefundRequest {
  idSolDevolucao: string;
  ispb: number;
  resultadoAnalise: JdpiPixRefundAnalysisResult;
  detalhesAnalise?: string;
  endToEndIdDevolucao: string; // Obligatory when "resultadoAnalise" is "0 - Aceita Totalmente" or "1 - Aceita Parcialmente".
}

export interface JdpiClosePixRefundResponse {
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

export class JdpiClosePixRefundPspGateway
  implements Pick<ClosePixRefundPspGateway, 'closeRefundRequest'>
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
    private pspIspb: number,
  ) {
    this.logger = logger.child({
      context: JdpiClosePixRefundPspGateway.name,
    });
  }

  async closeRefundRequest(
    request: ClosePixRefundPspRequest,
  ): Promise<ClosePixRefundPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const payload: JdpiClosePixRefundRequest = {
      idSolDevolucao: request.solicitationPspId,
      ispb: this.pspIspb,
      resultadoAnalise: Sanitize.parseJdpiPixRefundAnalysisResult(
        request.status,
      ),
      endToEndIdDevolucao: request.devolutionEndToEndId,
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
      const response = await this.axios.post<JdpiClosePixRefundResponse>(
        JDPI_SERVICES.PIX_REFUND.CLOSE,
        payload,
        { headers },
      );

      this.logger.info('Response found.', { data: response.data });

      return {
        solicitationPspId: response.data.idSolDevolucao,
        status:
          isDefined(response.data.stSolDevolucao) &&
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
