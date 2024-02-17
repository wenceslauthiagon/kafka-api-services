import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  JdpiAccountType,
  JdpiErrorTypes,
  JdpiKeyType,
  JdpiPersonType,
} from '@zro/jdpi/domain';
import {
  DecodedPixKeyPspRequest,
  DecodedPixKeyPspResponse,
  OfflinePixKeyPspException,
  PixKeyGateway,
  PixKeyPspException,
  PixKeyNotFoundExceptionPspException,
} from '@zro/pix-keys/application';
import {
  JdpiAuthGateway,
  Sanitize,
  JDPI_SERVICES,
} from '@zro/jdpi/infrastructure';

interface JdpiDecodedPixKeyRequest {
  chave: string;
}

export interface JdpiDecodedPixKeyResponse {
  tpChave: JdpiKeyType;
  chave: string;
  ispb: number;
  nrAgencia?: string;
  tpConta: JdpiAccountType;
  nrConta: string;
  dtHrAberturaConta: Date;
  tpPessoa: JdpiPersonType;
  cpfCnpj: number;
  nome: string;
  nomeFantasia?: string;
  dtHrCriacaoChave: Date;
  dtHrInicioPosseChave: Date;
  dtHrAberturaReivindicacao?: Date;
  endToEndId: string;
  estatisticas: {
    dtHrUltAtuAntiFraude: string;
    contadores: {
      tipo?: number;
      agregado?: number;
      d3?: number;
      d30?: number;
      m6?: number;
    }[];
  };
}

export class JdpiDecodedPixKeyPspGateway
  implements Pick<PixKeyGateway, 'decodePixKey'>
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
  ) {
    this.logger = logger.child({ context: JdpiDecodedPixKeyPspGateway.name });
  }

  async decodePixKey(
    request: DecodedPixKeyPspRequest,
  ): Promise<DecodedPixKeyPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const params: JdpiDecodedPixKeyRequest = {
      chave: Sanitize.key(request.key, request.keyType),
    };

    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
      'PI-PayerId': Sanitize.document(request.userDocument),
      ...(request.endToEndId && { 'PI-EndToEndId': request.endToEndId }),
      ...(request.ispb && {
        'PI-RequestingParticipant': Sanitize.ispb(request.ispb),
      }),
    };

    this.logger.info('Request params and headers.', {
      params,
      headers: {
        'PI-PayerId': Sanitize.document(request.userDocument),
        ...(request.endToEndId && { 'PI-EndToEndId': request.endToEndId }),
        ...(request.ispb && {
          'PI-RequestingParticipant': Sanitize.ispb(request.ispb),
        }),
      },
    });

    try {
      const response = await this.axios.get<JdpiDecodedPixKeyResponse>(
        `${JDPI_SERVICES.PIX_KEY.DECODE}/${params.chave}`,
        { headers },
      );

      this.logger.info('Response found.', { data: response.data });

      const personType = Sanitize.getPersonType(response.data.tpPessoa);

      return {
        type: Sanitize.getKeyType(response.data.tpChave),
        key: response.data.chave,
        ispb: Sanitize.getIspb(response.data.ispb),
        branch: Sanitize.branch(response.data.nrAgencia),
        ...(response.data.nrAgencia && {
          branch: Sanitize.branch(response.data.nrAgencia),
        }),
        accountNumber: Sanitize.accountNumber(response.data.nrConta),
        accountType: Sanitize.getAccountType(response.data.tpConta),
        personType: personType,
        document: Sanitize.getDocument(response.data.cpfCnpj, personType),
        name: Sanitize.fullName(response.data.nome),
        ...(response.data.nomeFantasia && {
          tradeName: Sanitize.fullName(response.data.nomeFantasia),
        }),
        keyCreationDate: new Date(response.data.dtHrCriacaoChave),
        accountOpeningDate: new Date(response.data.dtHrAberturaConta),
        keyOwnershipDate: new Date(response.data.dtHrInicioPosseChave),
        ...(response.data.dtHrAberturaReivindicacao && {
          claimRequestDate: new Date(response.data.dtHrAberturaReivindicacao),
        }),
        endToEndId: response.data.endToEndId,
        activeAccount: true,
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
          case JdpiErrorTypes.NOT_FOUND:
            throw new PixKeyNotFoundExceptionPspException(error);
          case JdpiErrorTypes.INTERNAL_SERVER_ERROR:
          case JdpiErrorTypes.SERVICE_UNAVAILABLE:
            throw new OfflinePixKeyPspException(error);
          default: // AuthorizationError, InternalServerError
        }
      }

      this.logger.error('Unexpected Jdpi gateway error', {
        error: error.isAxiosError ? error.message : error,
        request: error.config,
        response: error.response?.data ?? error.response ?? error,
      });
      throw new PixKeyPspException(error);
    }
  }
}
