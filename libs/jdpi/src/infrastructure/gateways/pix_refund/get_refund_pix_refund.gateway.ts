import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { isDefined } from 'class-validator';
import { MissingDataException } from '@zro/common';
import { PixRefundType } from '@zro/pix-payments/domain';
import {
  JdpiErrorTypes,
  JdpiPixRefundAnalysisResult,
  JdpiPixRefundParticipant,
  JdpiPixRefundReasonType,
  JdpiPixRefundRejectionReason,
  JdpiPixRefundStatus,
} from '@zro/jdpi/domain';
import {
  OfflinePixPaymentPspException,
  PixPaymentPspException,
  GetPixRefundPspGateway,
  GetPixRefundPspRequest,
  GetPixRefundPspResponse,
} from '@zro/pix-payments/application';
import {
  JdpiAuthGateway,
  Sanitize,
  JDPI_SERVICES,
} from '@zro/jdpi/infrastructure';

interface JdpiGetPixRefundRequest {
  ispb: number;
  tpPsp?: JdpiPixRefundParticipant;
  stSolDevolucao?: JdpiPixRefundStatus;
  endToEndId?: string;
  incluiDetalhes?: boolean;
  dtHrModificacaoInicio?: string;
  dtHrModificacaoFim?: string;
  pagina?: number;
  tamanhoPagina?: number;
}

interface JdpiGetPixRefundItem {
  endToEndId: string;
  motivo: JdpiPixRefundReasonType;
  valorDevolucao: number;
  detalhes?: string;
  idSolDevolucao: string;
  idRelatoInfracao?: string;
  stSolDevolucao: JdpiPixRefundStatus;
  ispbSolicitante: number;
  ispbContestado: number;
  dtHrCriacaoSolDevolucao: string;
  dtHrUltModificacao: string;
  resultadoAnalise?: JdpiPixRefundAnalysisResult;
  detalhesAnalise?: string;
  motivoRejeicao?: JdpiPixRefundRejectionReason;
  endToEndIdDevolucao?: string;
}

export interface JdpiGetPixRefundResponse {
  dtHrJdPi: string;
  solicitacoesDevolucao?: JdpiGetPixRefundItem[];
}

/**
 * Lists all pix refund requests created by the PSP as well as those received from other PSPs.
 */
export class JdpiGetPixRefundPspGateway
  implements Pick<GetPixRefundPspGateway, 'getRefundRequest'>
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
    private pspIspb: number,
  ) {
    this.logger = logger.child({
      context: JdpiGetPixRefundPspGateway.name,
    });
  }

  async getRefundRequest(
    request: GetPixRefundPspRequest,
  ): Promise<GetPixRefundPspResponse[]> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    // Get all refunds where the psp has been contested.
    const params: JdpiGetPixRefundRequest = {
      ispb: this.pspIspb,
      stSolDevolucao: Sanitize.parsePixRefundStatusToJdpiPixRefundStatus(
        request.status,
      ),
    };

    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
    };

    this.logger.info('Request params.', { params });

    try {
      const responseWithContested =
        await this.axios.get<JdpiGetPixRefundResponse>(
          JDPI_SERVICES.PIX_REFUND.GET_ALL,
          {
            params: { ...params, tpPsp: JdpiPixRefundParticipant.CONTESTED },
            headers,
          },
        );

      this.logger.info('Response with contested found.', {
        data: responseWithContested?.data?.solicitacoesDevolucao,
      });

      const responseWithRequesting =
        await this.axios.get<JdpiGetPixRefundResponse>(
          JDPI_SERVICES.PIX_REFUND.GET_ALL,
          {
            params: { ...params, tpPsp: JdpiPixRefundParticipant.REQUESTING },
            headers,
          },
        );

      this.logger.info('Response with requesting found.', {
        data: responseWithRequesting?.data?.solicitacoesDevolucao,
      });

      const response = [];

      if (responseWithContested?.data?.solicitacoesDevolucao?.length) {
        response.push(...responseWithContested.data.solicitacoesDevolucao);
      }

      if (responseWithRequesting?.data?.solicitacoesDevolucao?.length) {
        response.push(...responseWithRequesting.data.solicitacoesDevolucao);
      }

      return response.map((refund) => ({
        transactionEndToEndId: refund.endToEndId,
        solicitationId: refund.idSolDevolucao,
        infractionId: refund.idRelatoInfracao,
        contested: true,
        endToEndId: refund.endToEndIdDevolucao,
        refundAmount: refund.valorDevolucao
          ? Sanitize.getInt(refund.valorDevolucao)
          : 0,
        refundDetails: refund.detalhes,
        refundReason:
          isDefined(refund.motivo) &&
          Sanitize.parseJdpiPixRefundReasonTypeToPixRefundReason(refund.motivo),
        refundType: PixRefundType.CONTESTED,
        requesterIspb:
          isDefined(refund.ispbSolicitante) &&
          Sanitize.getIspb(refund.ispbSolicitante),
        responderIspb:
          isDefined(refund.ispbContestado) &&
          Sanitize.getIspb(refund.ispbContestado),
        status:
          isDefined(refund.stSolDevolucao) &&
          Sanitize.parsePixRefundStatus(refund.stSolDevolucao),
        creationDate:
          refund.dtHrCriacaoSolDevolucao &&
          Sanitize.toDate(refund.dtHrCriacaoSolDevolucao),
        lastChangeDate:
          refund.dtHrUltModificacao &&
          Sanitize.toDate(refund.dtHrUltModificacao),
        refundAnalisysDetails: refund.detalhesAnalise,
        refundAnalisysResult:
          isDefined(refund.resultadoAnalise) &&
          Sanitize.parseAnalysisResult(refund.resultadoAnalise),
        refundRejectionReason:
          isDefined(refund.motivoRejeicao) &&
          Sanitize.parsePixRefundPixRefundRejectionReason(
            refund.motivoRejeicao,
          ),
      }));
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
