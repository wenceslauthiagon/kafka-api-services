import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { MissingDataException } from '@zro/common';
import { PixKeyClaimEntity } from '@zro/pix-keys/domain';
import {
  JdpiAccountType,
  JdpiCanceledBy,
  JdpiReasonType,
  JdpiClaimStatusType,
  JdpiClaimType,
  JdpiErrorTypes,
  JdpiKeyType,
  JdpiPersonType,
} from '@zro/jdpi/domain';
import {
  CreateOwnershipClaimPspRequest,
  CreateOwnershipClaimPspResponse,
  CreatePortabilityClaimPspRequest,
  CreatePortabilityClaimPspResponse,
  OfflinePixKeyPspException,
  PixKeyGateway,
  PixKeyPspException,
} from '@zro/pix-keys/application';
import {
  JdpiAuthGateway,
  Sanitize,
  JDPI_SERVICES,
} from '@zro/jdpi/infrastructure';

interface JdpiCreateClaimRequest {
  tpReivindicacao: JdpiClaimType;
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
}

export interface JdpiCreateClaimResponse {
  ispbDoador?: number;
  idReivindicacao: string;
  stReivindicacao: JdpiClaimStatusType;
  motivoConfirmacao?: JdpiReasonType;
  motivoCancelamento?: JdpiReasonType;
  canceladaPor?: JdpiCanceledBy;
  dtHrLimiteResolucao: Date;
  dtHrLimiteConclusao?: Date;
  dtHrUltModificacao: Date;
}

export class JdpiCreateClaimPixKeyPspGateway
  implements
    Pick<PixKeyGateway, 'createOwnershipClaim' | 'createPortabilityClaim'>
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: JdpiCreateClaimPixKeyPspGateway.name,
    });
  }

  async createPortabilityClaim(
    request: CreatePortabilityClaimPspRequest,
  ): Promise<CreatePortabilityClaimPspResponse> {
    return this.createClaim(request, JdpiClaimType.PORTABILITY);
  }

  async createOwnershipClaim(
    request: CreateOwnershipClaimPspRequest,
  ): Promise<CreateOwnershipClaimPspResponse> {
    return this.createClaim(request, JdpiClaimType.OWNERSHIP);
  }

  private async createClaim(
    request: CreateOwnershipClaimPspRequest,
    claimType: JdpiClaimType,
  ): Promise<CreateOwnershipClaimPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Request']);
    }

    const payload: JdpiCreateClaimRequest = {
      tpReivindicacao: claimType,
      tpChave: Sanitize.parseKeyType(request.keyType),
      chave: Sanitize.key(request.key, request.keyType),
      ispb: Sanitize.parseIspb(request.ispb),
      nrAgencia: Sanitize.branch(request.branch),
      tpConta: JdpiAccountType.CACC,
      nrConta: Sanitize.accountNumber(request.accountNumber),
      dtHrAberturaConta: request.accountOpeningDate,
      tpPessoa: Sanitize.parsePersonType(request.personType),
      cpfCnpj: Sanitize.parseDocument(request.document),
      nome: Sanitize.fullName(request.name),
      ...(request.tradeName && {
        nomeFantasia: Sanitize.fullName(request.tradeName),
      }),
    };

    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
      'Chave-Idempotencia': request.pixKeyId,
    };

    this.logger.info('Request payload.', { payload });

    try {
      const response = await this.axios.post<JdpiCreateClaimResponse>(
        JDPI_SERVICES.PIX_KEY.CLAIMS,
        payload,
        { headers },
      );

      this.logger.info('Response found.', { data: response.data });

      return {
        key: request.key,
        keyType: request.keyType,
        claim: response.data.idReivindicacao
          ? new PixKeyClaimEntity({ id: response.data.idReivindicacao })
          : null,
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
