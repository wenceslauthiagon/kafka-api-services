import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  JdpiReasonType,
  JdpiErrorTypes,
  JdpiKeyType,
  JdpiPersonType,
} from '@zro/jdpi/domain';
import {
  PixKeyOwnedBySamePersonPspException,
  PixKeyOwnedByThirdPersonPspException,
  PixKeyPspException,
  PixKeyGateway,
  CreatePixKeyPspRequest,
  CreatePixKeyPspResponse,
  MaxNumberOfPixKeysReachedPixKeyPspException,
  PixKeyLockedByClaimPspException,
  PixKeyDuplicatePspException,
  InvalidDataFormatPixKeyPspException,
  OfflinePixKeyPspException,
} from '@zro/pix-keys/application';
import {
  JdpiAuthGateway,
  Sanitize,
  JDPI_SERVICES,
} from '@zro/jdpi/infrastructure';

export interface JdpiCreatePixKeyRequest {
  chave?: string;
  ispb: number;
  tpChave: JdpiKeyType;
  nrAgencia: string;
  tpConta: number;
  nrConta?: string;
  dtHrAberturaConta: Date;
  tpPessoa: JdpiPersonType;
  cpfCnpj: number;
  nome: string;
  nomeFantasia: string;
  motivo: JdpiReasonType;
}

interface JdpiCreatePixKeyResponse {
  chave: string;
  dtHrCriacaoChave: Date;
  dtHrInicioPosseChave: Date;
}

export class JdpiCreatePixKeyPspGateway
  implements Pick<PixKeyGateway, 'createPixKey'>
{
  constructor(
    private readonly logger: Logger,
    private readonly axios: AxiosInstance,
  ) {
    this.logger = logger.child({ context: JdpiCreatePixKeyPspGateway.name });
  }

  async createPixKey(
    request: CreatePixKeyPspRequest,
  ): Promise<CreatePixKeyPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const payload: JdpiCreatePixKeyRequest = {
      tpChave: Sanitize.parseKeyType(request.keyType),
      tpPessoa: Sanitize.parsePersonType(request.personType),
      cpfCnpj: Sanitize.parseDocument(request.document),
      nome: Sanitize.fullName(request.name),
      ...(request.tradeName && {
        nomeFantasia: Sanitize.fullName(request.tradeName),
      }),
      nrAgencia: Sanitize.branch(request.branch),
      nrConta: Sanitize.accountNumber(request.accountNumber),
      dtHrAberturaConta: request.accountOpeningDate,
      tpConta: Sanitize.parseAccountType(request.accountType),
      ispb: Sanitize.parseIspb(request.ispb),
      motivo: Sanitize.parseReason(request.reason),
      chave: Sanitize.key(request.key, request.keyType),
    };

    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
      'Chave-Idempotencia': request.pixKeyId,
    };

    this.logger.info('Request payload.', { payload });

    try {
      const response = await this.axios.post<JdpiCreatePixKeyResponse>(
        JDPI_SERVICES.PIX_KEY.ENTRIES,
        payload,
        { headers },
      );

      this.logger.info('Response found.', { data: response.data });

      return {
        key: response.data.chave,
        keyType: request.keyType,
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
          case JdpiErrorTypes.ENTRY_ALREADY_EXISTS:
            throw new PixKeyDuplicatePspException(error);
          case JdpiErrorTypes.ENTRY_KEY_OWNED_BY_DIFFERENT_PERSON:
            throw new PixKeyOwnedByThirdPersonPspException(error);
          case JdpiErrorTypes.ENTRY_KEY_IN_CUSTODY_OF_DIFFERENT_PARTICIPANT:
            throw new PixKeyOwnedBySamePersonPspException(error);
          case JdpiErrorTypes.ENTRY_LOCKED_BY_CLAIM:
            throw new PixKeyLockedByClaimPspException(error);
          case JdpiErrorTypes.ENTRY_LIMIT_EXCEEDED:
            throw new MaxNumberOfPixKeysReachedPixKeyPspException(error);
          case JdpiErrorTypes.ENTRY_INVALID:
            throw new InvalidDataFormatPixKeyPspException(error);
          case JdpiErrorTypes.INTERNAL_SERVER_ERROR:
          case JdpiErrorTypes.SERVICE_UNAVAILABLE:
            throw new OfflinePixKeyPspException(error);
          default: // AuthorizationError, NotFoundError, InternalServerError
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
