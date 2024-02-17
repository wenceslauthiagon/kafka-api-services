import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { isDefined } from 'class-validator';
import { MissingDataException } from '@zro/common';
import {
  JdpiAccountType,
  JdpiClaimParticipationFlow,
  JdpiClaimStatusType,
  JdpiClaimType,
  JdpiErrorTypes,
  JdpiKeyType,
  JdpiPersonType,
} from '@zro/jdpi/domain';
import {
  OfflinePixKeyPspException,
  PixKeyPspException,
  PixKeyGateway,
  GetClaimPixKeyPspRequest,
  GetClaimPixKeyPspResponse,
  GetClaimPixKeyPspResponseItem,
} from '@zro/pix-keys/application';
import {
  JdpiAuthGateway,
  JDPI_SERVICES,
  Sanitize,
  JdpiClaimParticipationFlowException,
  formatDocument,
} from '@zro/jdpi/infrastructure';

interface JdpiGetClaimPixKeyRequest {
  ispb: number;
  tpPessoaLogada?: JdpiPersonType;
  cpfCnpjLogado?: number;
  nrAgenciaLogada?: string;
  tpContaLogada?: JdpiAccountType;
  nrContaLogada?: string;
  nrLimite?: number;
}

interface JdpiGetClaimPixKeyResponse {
  dtHrJdPi: string;
  temMaisElementos?: boolean;
  reivindicacoesAssociadas?: JdpiAssociatedClaim[];
}

interface JdpiAssociatedClaim {
  tpReivindicacao: JdpiClaimType;
  fluxoParticipacao: JdpiClaimParticipationFlow;
  chave: string;
  tpChave: JdpiKeyType;
  ispb: number;
  nrAgencia?: string;
  tpConta: JdpiAccountType;
  nrConta: string;
  dtHrAberturaConta: string;
  tpPessoa: JdpiPersonType;
  cpfCnpj: number;
  ispbDoador: number;
  dadosDoador?: JdpiDonorData;
  idReivindicacao: string;
  stReivindicacao: JdpiClaimStatusType;
  motivoConfirmacao?: number;
  motivoCancelamento?: number;
  canceladaPor?: number;
  dtHrLimiteResolucao: Date;
  dtHrLimiteConclusao?: Date;
  dtHrUltModificacao: Date;
}

interface JdpiDonorData {
  nrAgencia?: string;
  tpConta: JdpiAccountType;
  nrConta: string;
  tpPessoa: JdpiPersonType;
  cpfCnpj: number;
  nome: string;
  nomeFantasia?: string;
}

export class JdpiGetClaimPixKeyPspGateway
  implements Pick<PixKeyGateway, 'getClaimPixKey'>
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
  ) {
    this.logger = logger.child({ context: JdpiGetClaimPixKeyPspGateway.name });
  }

  async getClaimPixKey(
    request: GetClaimPixKeyPspRequest,
  ): Promise<GetClaimPixKeyPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const payload: JdpiGetClaimPixKeyRequest = {
      ispb: Sanitize.parseIspb(request.ispb),
      ...(request.personType && {
        tpPessoaLogada: Sanitize.parsePersonType(request.personType),
      }),
      ...(request.document && {
        cpfCnpjLogado: Sanitize.parseDocument(request.document),
      }),
      ...(request.branch && {
        nrAgenciaLogada: Sanitize.branch(request.branch),
      }),
      ...(request.accountType && {
        tpContaLogada: Sanitize.parseAccountType(request.accountType),
      }),
      ...(request.accountNumber && {
        nrContaLogada: Sanitize.accountNumber(request.accountNumber),
      }),
      ...(request.limit && { nrLimite: request.limit }),
    };

    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
    };

    this.logger.info('Request payload.', { payload });

    try {
      const response = await this.axios.post<JdpiGetClaimPixKeyResponse>(
        JDPI_SERVICES.PIX_KEY.CLAIMS_LIST,
        payload,
        { headers },
      );

      this.logger.info('Response found.', { data: response.data });

      const claims =
        response.data.reivindicacoesAssociadas.map<GetClaimPixKeyPspResponseItem>(
          (claim) => {
            const { ispb, branch, accountNumber, personType, document } =
              this.getClaimData(claim);

            const keyType = Sanitize.getKeyType(claim.tpChave);

            return {
              type: Sanitize.getClaimType(claim.tpReivindicacao),
              key: Sanitize.key(claim.chave, keyType),
              keyType,
              ispb,
              branch,
              accountNumber,
              personType,
              document,
              id: claim.idReivindicacao,
              status: Sanitize.getClaimStatusType(claim.stReivindicacao),
              finalResolutionDate: new Date(claim.dtHrLimiteResolucao),
              finalCompleteDate:
                claim.dtHrLimiteConclusao &&
                new Date(claim.dtHrLimiteConclusao),
              lastChangeDate: new Date(claim.dtHrUltModificacao),
            };
          },
        );

      return { hasMoreElements: response.data.temMaisElementos, claims };
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

  private getClaimData(
    claim: JdpiAssociatedClaim,
  ): Partial<GetClaimPixKeyPspResponseItem> {
    if (claim.fluxoParticipacao === JdpiClaimParticipationFlow.DONOR) {
      return {
        ispb: Sanitize.getIspb(claim.ispb),
        branch: claim.nrAgencia && Sanitize.branch(claim.nrAgencia),
        accountNumber: Sanitize.accountNumber(claim.nrConta),
        personType: Sanitize.getPersonType(claim.tpPessoa),
        document: formatDocument(claim.cpfCnpj, claim.tpPessoa),
      };
    }

    if (claim.fluxoParticipacao === JdpiClaimParticipationFlow.CLAIMANT) {
      return {
        ispb: Sanitize.getIspb(claim.ispbDoador),
        branch:
          claim.dadosDoador?.nrAgencia &&
          Sanitize.branch(claim.dadosDoador?.nrAgencia),
        accountNumber:
          claim.dadosDoador?.nrConta &&
          Sanitize.accountNumber(claim.dadosDoador?.nrConta),
        personType: isDefined(claim.dadosDoador?.tpPessoa)
          ? Sanitize.getPersonType(claim.dadosDoador?.tpPessoa)
          : null,
        document:
          isDefined(claim.dadosDoador?.cpfCnpj) &&
          isDefined(claim.dadosDoador?.tpPessoa)
            ? formatDocument(
                claim.dadosDoador?.cpfCnpj,
                claim.dadosDoador?.tpPessoa,
              )
            : null,
      };
    }

    throw new JdpiClaimParticipationFlowException(claim.fluxoParticipacao);
  }
}
