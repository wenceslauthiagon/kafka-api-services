import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { isNumber } from 'class-validator';
import { MissingDataException } from '@zro/common';
import { JdpiErrorTypes, JdpiFormatQrCode } from '@zro/jdpi/domain';
import { PersonType } from '@zro/users/domain';
import {
  CreateQrCodeDynamicDueDatePixPaymentPspRequest,
  CreateQrCodeDynamicDueDatePixPaymentPspResponse,
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

interface JdpiCreateQrCodeDynamicDueDatePixPaymentRequest {
  formato: JdpiFormatQrCode;
  chave: string;
  codigoCategoria?: string;
  cpfRecebedor?: string;
  cnpjRecebedor?: string;
  nomeRecebedor: string;
  nomeFantasiaRecebedor?: string;
  logradouroRecebedor: string;
  cidade: string;
  uf: string;
  cep: string;
  solicitacaoPagador?: string;
  cpfPagador?: string;
  cnpjPagador?: string;
  nomePagador: string;
  valorOriginal?: number;
  abatimento?: number;
  desconto?: number;
  juros?: number;
  multa?: number;
  valorFinal: number;
  dtVenc: string;
  diasAposVenc: number;
  idConciliacaoRecebedor: string;
  dadosAdicionais?: {
    nome: string;
    valor: string;
  }[];
  reutilizavel?: boolean;
  urlPayloadJson: string;
}

interface JdpiCreateQrCodeDynamicDueDatePixPaymentResponse {
  idDocumento: string;
  imagemQrCodeInBase64?: string;
  payloadBase64?: string;
}

export class JdpiCreateQrCodeDynamicDueDatePixPaymentPspGateway
  implements Pick<PixPaymentGateway, 'createQrCodeDynamicDueDate'>
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
    private pspOpenBankingBaseUrl: string,
  ) {
    this.logger = logger.child({
      context: JdpiCreateQrCodeDynamicDueDatePixPaymentPspGateway.name,
    });
  }

  async createQrCodeDynamicDueDate(
    request: CreateQrCodeDynamicDueDatePixPaymentPspRequest,
  ): Promise<CreateQrCodeDynamicDueDatePixPaymentPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const payload: JdpiCreateQrCodeDynamicDueDatePixPaymentRequest = {
      formato: JdpiFormatQrCode.PAYLOAD,
      idConciliacaoRecebedor: Sanitize.txId(request.txId),
      chave: request.key,
      ...(request.recipientPersonType === PersonType.NATURAL_PERSON
        ? { cpfRecebedor: Sanitize.document(request.recipientDocument) }
        : { cnpjRecebedor: Sanitize.document(request.recipientDocument) }),
      nomeRecebedor: Sanitize.fullName(request.recipientName, 25),
      logradouroRecebedor: Sanitize.description(request.recipientAddress),
      cidade: Sanitize.fullName(request.recipientCity, 15),
      uf: Sanitize.description(request.recipientFeredativeUnit),
      cep: Sanitize.description(request.recipientZipCode),
      ...(request.payerRequest && {
        solicitacaoPagador: Sanitize.description(request.payerRequest),
      }),
      ...(request.payerPersonType === PersonType.NATURAL_PERSON
        ? { cpfPagador: Sanitize.document(request.payerDocument) }
        : { cnpjPagador: Sanitize.document(request.payerDocument) }),
      nomePagador: Sanitize.fullName(request.payerName, 25),
      valorOriginal: Sanitize.parseValue(request.documentValue),
      ...(request.discountValue && {
        desconto: Sanitize.parseValue(request.discountValue),
      }),
      ...(isNumber(request.fineValue) && {
        multa: Sanitize.parseValue(request.fineValue),
      }),
      valorFinal: Sanitize.parseValue(request.documentValue),
      dtVenc: Sanitize.formatToYearMonthDay(request.dueDate),
      diasAposVenc: !request.expirationDate
        ? 0 // Expires at due date.
        : Sanitize.getDiffDaysBetweenDates(
            request.dueDate,
            request.expirationDate,
          ),
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
      }/${ZROBANK_OPEN_BANKING_SERVICES.DYNAMIC_QR_CODE.GET_JWS_DUE_DATE(
        request.qrCodeDynamicId,
      )}`,
    };

    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
    };

    this.logger.info('Request payload.', { payload });

    try {
      const response =
        await this.axios.post<JdpiCreateQrCodeDynamicDueDatePixPaymentResponse>(
          JDPI_SERVICES.PIX_PAYMENT.QR_CODE_DYNAMIC_DUE_DATE.CREATE,
          payload,
          { headers },
        );

      this.logger.info('Response found.', { data: response.data });

      return {
        emv: Sanitize.decodeBase64(response.data.payloadBase64),
        paymentLinkUrl: payload.urlPayloadJson,
        externalId: response.data.idDocumento,
        payloadJws: null,
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
