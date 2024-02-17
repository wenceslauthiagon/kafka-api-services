import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { isDefined, isNumber } from 'class-validator';
import { MissingDataException } from '@zro/common';
import {
  JdpiErrorTypes,
  JdpiFormatQrCode,
  JdpiAgentModalityType,
  JdpiModalityUpdateType,
} from '@zro/jdpi/domain';
import {
  CreateQrCodeDynamicPixPaymentPspRequest,
  CreateQrCodeDynamicPixPaymentPspResponse,
  OfflinePixPaymentPspException,
  PixPaymentGateway,
  PixPaymentPspException,
} from '@zro/pix-payments/application';
import {
  JdpiAuthGateway,
  Sanitize,
  JDPI_SERVICES,
  ZROBANK_OPEN_BANKING_SERVICES,
} from '@zro/jdpi/infrastructure';

interface JdpiCreateQrCodeDynamicInstantPixPaymentRequest {
  formato: JdpiFormatQrCode;
  ispbCertificadoJws?: number;
  chave: string;
  codigoCategoria?: string;
  nomeRecebedor: string;
  solicitacaoPagador?: string;
  cpfPagador?: string;
  cnpjPagador?: string;
  nomePagador?: string;
  cidade: string;
  cep?: string;
  valorOriginal: number;
  modalidadeAlteracao?: JdpiModalityUpdateType;
  valorSaque?: number;
  modalidadeAltSaque?: JdpiModalityUpdateType;
  ispbPssSaque?: number;
  modalidadeAgSaque?: JdpiAgentModalityType;
  valorTroco?: number;
  modalidadeAltTroco?: JdpiModalityUpdateType;
  ispbPssTroco?: number;
  modalidadeAgTroco?: JdpiAgentModalityType;
  expiracaoQR?: number;
  idConciliacaoRecebedor: string;
  dadosAdicionais?: {
    nome: string;
    valor: string;
  }[];
  reutilizavel?: boolean;
  urlPayloadJson: string;
  urlJwk: string;
}

interface JdpiCreateQrCodeInstantDynamicPixPaymentResponse {
  idDocumento: string;
  imagemQrCodeInBase64?: string;
  payloadBase64?: string;
  payloadJws: string;
}

export class JdpiCreateQrCodeDynamicPixPaymentPspGateway
  implements Pick<PixPaymentGateway, 'createQrCodeDynamic'>
{
  constructor(
    private readonly logger: Logger,
    private readonly axios: AxiosInstance,
    private readonly pspIspb: number,
    private readonly pspOpenBankingBaseUrl: string,
  ) {
    this.logger = logger.child({
      context: JdpiCreateQrCodeDynamicPixPaymentPspGateway.name,
    });
  }

  async createQrCodeDynamic(
    request: CreateQrCodeDynamicPixPaymentPspRequest,
  ): Promise<CreateQrCodeDynamicPixPaymentPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const payload: JdpiCreateQrCodeDynamicInstantPixPaymentRequest = {
      formato: JdpiFormatQrCode.PAYLOAD,
      ispbCertificadoJws: this.pspIspb,
      idConciliacaoRecebedor: Sanitize.txId(request.txId),
      chave: request.key,
      cidade: Sanitize.fullName(request.recipientCity, 15),
      nomeRecebedor: Sanitize.fullName(request.recipientName, 25),
      ...(request.payerRequest && {
        solicitacaoPagador: Sanitize.description(request.payerRequest),
      }),
      valorOriginal: Sanitize.parseValue(request.documentValue),
      ...(isDefined(request.valueModifiable) && {
        modalidadeAlteracao: Sanitize.parseModalityUpdateType(
          request.valueModifiable,
        ),
      }),
      ...(isNumber(request.withValue) && {
        valorSaque: Sanitize.parseValue(request.withValue),
      }),
      ...(isDefined(request.allowUpdateWithdrawal) && {
        modalidadeAltSaque: Sanitize.parseModalityUpdateType(
          request.allowUpdateWithdrawal,
        ),
      }),
      ...(isDefined(request.agentIspbWithdrawal) && {
        ispbPssSaque: Sanitize.parseIspb(request.agentIspbWithdrawal),
      }),
      ...(request.agentModChange && {
        modalidadeAgSaque: Sanitize.parseAgentMod(request.agentModWithdrawal),
      }),
      ...(isNumber(request.changeValue) && {
        valorTroco: Sanitize.parseValue(request.changeValue),
      }),
      ...(isDefined(request.allowUpdateChange) && {
        modalidadeAltTroco: Sanitize.parseModalityUpdateType(
          request.allowUpdateChange,
        ),
      }),
      ...(isDefined(request.agentIspbChange) && {
        ispbPssTroco: Sanitize.parseIspb(request.agentIspbChange),
      }),
      ...(request.agentModChange && {
        modalidadeAgTroco: Sanitize.parseAgentMod(request.agentModChange),
      }),
      ...(request.expirationDate && {
        expiracaoQR: Sanitize.getDiffSecondsBetweenDateAndNow(
          request.expirationDate,
        ),
      }),
      ...(request.description && {
        dadosAdicionais: [
          {
            nome: 'Informação adicional',
            valor: Sanitize.description(request.description),
          },
        ],
      }),
      urlPayloadJson: `${
        this.pspOpenBankingBaseUrl
      }/${ZROBANK_OPEN_BANKING_SERVICES.DYNAMIC_QR_CODE.GET_JWS_INSTANT(
        request.qrCodeDynamicId,
      )}`,
      urlJwk: `${this.pspOpenBankingBaseUrl}/${ZROBANK_OPEN_BANKING_SERVICES.DYNAMIC_QR_CODE.GET_JWK}`,
    };

    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
    };

    this.logger.info('Request payload.', { payload });

    try {
      const response =
        await this.axios.post<JdpiCreateQrCodeInstantDynamicPixPaymentResponse>(
          JDPI_SERVICES.PIX_PAYMENT.QR_CODE_DYNAMIC_INSTANT,
          payload,
          { headers },
        );

      this.logger.info('Response found.', { data: response.data });

      return {
        emv: Sanitize.decodeBase64(response.data.payloadBase64),
        paymentLinkUrl: payload.urlPayloadJson,
        payloadJws: response.data.payloadJws,
        externalId: response.data.idDocumento,
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
