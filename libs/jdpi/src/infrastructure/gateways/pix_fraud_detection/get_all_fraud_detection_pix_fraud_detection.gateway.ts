import { AxiosInstance } from 'axios';
import { MissingDataException, getMoment } from '@zro/common';
import { Logger } from 'winston';
import {
  OfflinePixPaymentPspException,
  PixFraudDetectionGateway,
  PixPaymentPspException,
} from '@zro/pix-payments/application';
import {
  JdpiAuthGateway,
  Sanitize,
  JDPI_SERVICES,
} from '@zro/jdpi/infrastructure';
import {
  JdpiErrorTypes,
  JdpiFraudDetectionStatus,
  JdpiPersonType,
  JdpiPixInfractionFraudType,
} from '@zro/jdpi/domain';
import {
  GetAllFraudDetectionPixFraudDetectionPspRequest,
  GetAllFraudDetectionPixFraudDetectionPspResponse,
} from '@zro/pix-payments/application';
import { isDefined } from 'class-validator';

interface JdpiGetAllFraudDetectionPixFraudDetectionPspRequest {
  ispb: number;
  cpfCnpj?: number; // Obligatory when “dtHrCriacaoInicio” is not informed.
  chave?: string;
  tpFraude?: JdpiPixInfractionFraudType;
  stMarcacaoFraude?: JdpiFraudDetectionStatus;
  dtHrCriacaoInicio?: Date;
  dtHrCriacaoFim?: Date;
  pagina?: number;
  tamanhoPagina?: number;
}

interface JdpiGetAllFraudDetectionPixFraudDetectionPspResponseData {
  idMarcacaoFraude: string;
  cpfCnpj: number;
  chave?: string;
  tpFraude: JdpiPixInfractionFraudType;
  stMarcacaoFraude: JdpiFraudDetectionStatus;
  tpPessoa: JdpiPersonType;
  dtHrCriacaoMarcacaoFraude: Date;
  dtHrUltModificacao: Date;
}

interface JdpiGetAllFraudDetectionPixFraudDetectionPspResponse {
  dtHrJdPi: Date;
  marcacoesInfracao?: JdpiGetAllFraudDetectionPixFraudDetectionPspResponseData[];
}

export class JdpiGetAllFraudDetectionPixFraudDetectionPspGateway
  implements Pick<PixFraudDetectionGateway, 'getAllFraudDetection'>
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
    private pspIspb: number,
  ) {
    this.logger = logger.child({
      context: JdpiGetAllFraudDetectionPixFraudDetectionPspGateway.name,
    });
  }

  async getAllFraudDetection(
    request: GetAllFraudDetectionPixFraudDetectionPspRequest,
  ): Promise<GetAllFraudDetectionPixFraudDetectionPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const params: JdpiGetAllFraudDetectionPixFraudDetectionPspRequest = {
      ispb: this.pspIspb,
      ...(request.document && {
        cpfCnpj: Sanitize.parseDocument(request.document),
      }),
      ...(request.key && { chave: request.key }),
      ...(request.fraudType && {
        tpFraude: Sanitize.parseFraudType(request.fraudType),
      }),
      ...(request.status && {
        stMarcacaoFraude: Sanitize.getFraudDetectionStatus(request.status),
      }),
      dtHrCriacaoInicio: getMoment(request.createdAtStart)
        .startOf('day')
        .toDate(),
      dtHrCriacaoFim: getMoment(request.createdAtEnd).endOf('day').toDate(),
      ...(request.page && { pagina: request.page }),
      ...(request.size && { tamanhoPagina: request.size }),
    };

    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
    };

    this.logger.info('Request params.', { params });

    try {
      const response =
        await this.axios.get<JdpiGetAllFraudDetectionPixFraudDetectionPspResponse>(
          JDPI_SERVICES.PIX_FRAUD_DETECTION.GET_ALL,
          { headers, params },
        );

      this.logger.info('Response found.', { data: response.data });

      const result = {
        fraudDetections: [],
      };

      if (!response?.data?.marcacoesInfracao?.length) {
        return result;
      }

      response.data.marcacoesInfracao.map((fraudDetection) => {
        const personType = Sanitize.getPersonType(fraudDetection.tpPessoa);

        result.fraudDetections.push({
          fraudDetectionId: fraudDetection.idMarcacaoFraude,
          document: Sanitize.getDocument(fraudDetection.cpfCnpj, personType),
          fraudType:
            isDefined(fraudDetection.tpFraude) &&
            Sanitize.getFraudType(fraudDetection.tpFraude),
          status:
            isDefined(fraudDetection.stMarcacaoFraude) &&
            Sanitize.parseFraudDetectionStatus(fraudDetection.stMarcacaoFraude),
          key: fraudDetection.chave,
        });
      });

      return result;
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
