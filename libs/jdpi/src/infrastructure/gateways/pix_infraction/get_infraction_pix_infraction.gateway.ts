import { AxiosInstance } from 'axios';
import { getMoment } from '@zro/common';
import { Logger } from 'winston';
import { isDefined } from 'class-validator';
import {
  GetInfractionPixInfractionPspRequest,
  GetInfractionPixInfractionPspResponse,
  OfflinePixPaymentPspException,
  PixInfractionGateway,
  PixPaymentPspException,
} from '@zro/pix-payments/application';
import { PixInfractionReport } from '@zro/pix-payments/domain';
import {
  JdpiAuthGateway,
  Sanitize,
  JDPI_SERVICES,
} from '@zro/jdpi/infrastructure';
import {
  JdpiErrorTypes,
  JdpiPixInfractionAnalysisResultType,
  JdpiPixInfractionReason,
  JdpiPixInfractionStatus,
  JdpiPixInfractionType,
} from '@zro/jdpi/domain';

interface JdpiInfractionPixInfractionPspRequest {
  ispb: number;
  ehRelatoSolicitado?: boolean;
  stRelatoInfracao?: JdpiPixInfractionStatus;
  incluiDetalhes?: boolean;
  dtHrModificacaoInicio?: Date;
  dtHrModificacaoFim?: Date;
  pagina?: number;
  tamanhoPagina?: number;
}

interface JdpiGetInfractionPspReportInfractionData {
  endToEndId: string;
  motivo: JdpiPixInfractionType;
  tpSitOrigem: JdpiPixInfractionReason;
  detalhes?: string;
  idRelatoInfracao: string;
  stRelatoInfracao: JdpiPixInfractionStatus;
  pspCriador: number;
  pspContraParte: number;
  dtHrCriacaoRelatoInfracao: Date;
  dtHrUltModificacao: Date;
  idMarcacaoFraude?: string;
  resultadoAnalise?: JdpiPixInfractionAnalysisResultType;
  detalhesAnalise?: string;
}

interface JdpiGetInfractionPixInfractionPspResponse {
  dtHrJdPi: Date;
  reporteInfracao?: JdpiGetInfractionPspReportInfractionData[];
}

export class JdpiGetInfractionPixInfractionPspGateway
  implements Pick<PixInfractionGateway, 'getInfractions'>
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
    private pspIspb: number,
  ) {
    this.logger = logger.child({
      context: JdpiGetInfractionPixInfractionPspGateway.name,
    });
  }

  async getInfractions(
    request: GetInfractionPixInfractionPspRequest,
  ): Promise<GetInfractionPixInfractionPspResponse[]> {
    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
    };

    const params: JdpiInfractionPixInfractionPspRequest = {
      ispb: this.pspIspb,
      ...(request.startCreationDate && {
        dtHrModificacaoInicio: getMoment(request.startCreationDate)
          .startOf('day')
          .toDate(),
      }),
      ...(request.endCreationDate && {
        dtHrModificacaoFim: getMoment(request.endCreationDate)
          .endOf('day')
          .toDate(),
      }),
    };

    this.logger.info('Request params.', { params });

    try {
      const responseWithRequested =
        await this.axios.get<JdpiGetInfractionPixInfractionPspResponse>(
          JDPI_SERVICES.PIX_INFRACTION.LIST,
          { headers, params: { ...params, ehRelatoSolicitado: true } },
        );

      this.logger.info('Response with requested found.', {
        data: responseWithRequested?.data?.reporteInfracao,
      });

      const responseWithNotRequested =
        await this.axios.get<JdpiGetInfractionPixInfractionPspResponse>(
          JDPI_SERVICES.PIX_INFRACTION.LIST,
          { headers, params: { ...params, ehRelatoSolicitado: false } },
        );

      this.logger.info('Response with not requested found.', {
        data: responseWithNotRequested?.data?.reporteInfracao,
      });

      const response = [];

      if (responseWithRequested?.data?.reporteInfracao?.length) {
        response.push(...responseWithRequested.data.reporteInfracao);
      }

      if (responseWithNotRequested?.data?.reporteInfracao?.length) {
        response.push(...responseWithNotRequested.data.reporteInfracao);
      }

      return response.map((infraction) => ({
        infractionId: infraction.idRelatoInfracao,
        ispb: Sanitize.getIspb(this.pspIspb),
        endToEndId: infraction.endToEndId,
        infractionType: Sanitize.getPixInfractionType(infraction.motivo),
        reportedBy:
          infraction.pspCriador === this.pspIspb
            ? PixInfractionReport.DEBITED_PARTICIPANT
            : PixInfractionReport.CREDITED_PARTICIPANT,
        ...(infraction.detalhes && { reportDetails: infraction.detalhes }),
        status:
          isDefined(infraction.stRelatoInfracao) &&
          Sanitize.getInfractionStatus(infraction.stRelatoInfracao),
        debitedParticipant:
          isDefined(infraction.pspCriador) &&
          Sanitize.getIspb(infraction.pspCriador),
        creditedParticipant:
          isDefined(infraction.pspContraParte) &&
          Sanitize.getIspb(infraction.pspContraParte),
        creationDate: new Date(infraction.dtHrCriacaoRelatoInfracao),
        lastChangeDate: new Date(infraction.dtHrUltModificacao),
        ...(isDefined(infraction.resultadoAnalise) && {
          analysisResult: Sanitize.getInfractionAnalysisResultType(
            infraction.resultadoAnalise,
          ),
        }),
        ...(infraction.detalhesAnalise && {
          analysisDetails: infraction.detalhesAnalise,
        }),
        isReporter: infraction.pspCriador === this.pspIspb,
        ...(infraction.stRelatoInfracao === JdpiPixInfractionStatus.CLOSED && {
          closingDate: new Date(infraction.dtHrUltModificacao),
        }),
        ...(infraction.stRelatoInfracao ===
          JdpiPixInfractionStatus.CANCELLED && {
          cancellationDate: new Date(infraction.dtHrUltModificacao),
        }),
      }));
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
          default: // AuthorizationError, NotFoundError, InternalServerError
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
