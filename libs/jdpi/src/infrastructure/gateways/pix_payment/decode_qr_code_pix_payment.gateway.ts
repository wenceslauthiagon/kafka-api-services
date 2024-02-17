import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { isDefined } from 'class-validator';
import { HttpStatus } from '@nestjs/common';
import { MissingDataException } from '@zro/common';
import { DecodedQrCodeType } from '@zro/pix-payments/domain';
import { PersonType } from '@zro/users/domain';
import {
  JdpiAccountType,
  JdpiPersonType,
  JdpiQRCodeStatus,
  JdpiDecodeQrCodeType,
  JdpiErrorTypes,
  JdpiAgentModalityType,
  JdpiModalityUpdateType,
} from '@zro/jdpi/domain';
import {
  DecodedQrCodeInvalidTypeException,
  DecodeQrCodePixPaymentPspRequest,
  DecodeQrCodePixPaymentPspResponse,
  PixPaymentGateway,
  OfflinePixPaymentPspException,
  PixPaymentPspException,
  DecodeQrCodeTimeoutPixPaymentPspException,
} from '@zro/pix-payments/application';
import {
  JdpiAuthGateway,
  Sanitize,
  JDPI_SERVICES,
  formatDocument,
} from '@zro/jdpi/infrastructure';

interface JdpiDecodeQrCodePixPaymentRequest {
  qrCodePayload: string;
  codMun?: string;
  dPP?: Date;
}

interface JdpiAdditionalInfosItem {
  nome: string;
  valor: string;
}

interface JdpiQrCodeBase {
  ispb: number;
  nrAgencia?: string;
  tpConta: JdpiAccountType;
  nrConta: string;
  chave: string;
  codigoCategoria?: string;
  nomeRecebedor: string;
  tpPessoaRecebedor: JdpiPersonType;
  cpfCnpjRecebedor?: number;
  cidade: string;
  cep?: string;
  idConciliacaoRecebedor?: string;
  ispbFss?: number;
}

interface JdpiQrCodeStatic extends JdpiQrCodeBase {
  valor?: number;
  dadosAdicionais?: string;
}

interface JdpiQrCodeDynamic extends JdpiQrCodeBase {
  revisao: number;
  solicitacaoPagador?: string;
  cpfPagador?: string;
  cnpjPagador?: string;
  nomePagador?: string;
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
  dadosAdicionais: JdpiAdditionalInfosItem[];
  dtHrCriacao: Date;
  dtHrApresentacao: Date;
  urlPspRecebedor?: string;
  reutilizavel: boolean;
  status: JdpiQRCodeStatus;
}

interface JdpiQrDynamicDueDate extends JdpiQrCodeBase {
  revisao: number;
  nomeFantasiaRecebedor?: string;
  logradouroRecebedor: string;
  uf: string;
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
  dadosAdicionais: JdpiAdditionalInfosItem[];
  dtHrCriacao: Date;
  dtHrApresentacao: Date;
  urlPspRecebedor?: string;
  reutilizavel?: boolean;
  status: JdpiQRCodeStatus;
}

export interface JdpiDecodeQrCodePixPaymentResponse {
  endToEndId: string;
  tpQRCode: JdpiDecodeQrCodeType;
  dadosQrCodeEstatico?: JdpiQrCodeStatic;
  dadosQrCodeDinamico?: JdpiQrCodeDynamic;
  dadosQrCodeDinamicoCobv?: JdpiQrDynamicDueDate;
}

export class JdpiDecodeQrCodePixPaymentPspGateway
  implements Pick<PixPaymentGateway, 'decodeQrCode'>
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: JdpiDecodeQrCodePixPaymentPspGateway.name,
    });
  }

  async decodeQrCode(
    request: DecodeQrCodePixPaymentPspRequest,
  ): Promise<DecodeQrCodePixPaymentPspResponse> {
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const payload: JdpiDecodeQrCodePixPaymentRequest = {
      qrCodePayload: request.emv.trim(),
      ...(request.paymentDate && { dPP: request.paymentDate }),
    };

    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
      'PI-PayerId': Sanitize.document(request.document),
    };

    this.logger.info('Request payload and headers.', {
      payload,
      headers: {
        'PI-PayerId': Sanitize.document(request.document),
      },
    });

    try {
      const response =
        await this.axios.post<JdpiDecodeQrCodePixPaymentResponse>(
          JDPI_SERVICES.PIX_PAYMENT.DECODE_QR_CODE,
          payload,
          { headers },
        );

      this.logger.info('Response found.', { data: response.data });

      if (response.data.tpQRCode === JdpiDecodeQrCodeType.QR_CODE_STATIC) {
        return this.decodeQrCodeStatic(
          response.data.endToEndId,
          response.data.dadosQrCodeEstatico,
        );
      }

      if (response.data.tpQRCode === JdpiDecodeQrCodeType.QR_CODE_DYNAMIC) {
        return this.decodeQrCodeDynamic(
          response.data.endToEndId,
          response.data.dadosQrCodeDinamico,
        );
      }

      if (
        response.data.tpQRCode === JdpiDecodeQrCodeType.QR_CODE_DYNAMIC_DUE_DATE
      ) {
        return this.decodeQrCodeDynamicDueDate(
          response.data.endToEndId,
          response.data.dadosQrCodeDinamicoCobv,
        );
      }

      throw new DecodedQrCodeInvalidTypeException(response.data.tpQRCode);
    } catch (error) {
      this.logger.error('ERROR Jdpi request.', {
        error: error.isAxiosError ? error.message : error,
      });

      if (error instanceof DecodedQrCodeInvalidTypeException) {
        throw error;
      }

      if (error.response?.data) {
        this.logger.error('ERROR Jdpi response data.', {
          error: error.response.data,
        });

        // Response status is 406 when the emv is invalid, so it returns null.
        if (error.response.status === HttpStatus.NOT_ACCEPTABLE) {
          return null;
        }

        const { codigo } = error.response.data;

        switch (codigo) {
          case JdpiErrorTypes.DECODE_QR_CODE_TIMEOUT:
            throw new DecodeQrCodeTimeoutPixPaymentPspException(error);
          case JdpiErrorTypes.INTERNAL_SERVER_ERROR:
          case JdpiErrorTypes.SERVICE_UNAVAILABLE:
            throw new OfflinePixPaymentPspException(error);
          default: // AuthorizationError, InternalServerError
        }
      }

      this.logger.error('Unexpected jdpi gateway error', {
        error: error.isAxiosError ? error.message : error,
        request: error.config,
        response: error.response?.data ?? error.response ?? error,
      });

      throw new PixPaymentPspException(error);
    }
  }

  private decodeQrCodeStatic(
    endToEndId: string,
    data: JdpiQrCodeStatic,
  ): DecodeQrCodePixPaymentPspResponse {
    const type = isDefined(data.ispbFss)
      ? DecodedQrCodeType.QR_CODE_STATIC_WITHDRAWAL
      : DecodedQrCodeType.QR_CODE_STATIC_INSTANT_PAYMENT;

    return {
      key: data.chave,
      txId: data.idConciliacaoRecebedor,
      documentValue: data.valor ? Sanitize.getInt(data.valor) : 0,
      additionalInfo: data.dadosAdicionais ?? null,
      recipientName:
        data.nomeRecebedor && Sanitize.fullName(data.nomeRecebedor),
      recipientPersonType: Sanitize.getPersonType(data.tpPessoaRecebedor),
      recipientDocument: formatDocument(
        data.cpfCnpjRecebedor,
        data.tpPessoaRecebedor,
      ),
      recipientIspb: isDefined(data.ispb) ? Sanitize.getIspb(data.ispb) : null,
      recipientBranch: data.nrAgencia && Sanitize.branch(data.nrAgencia),
      recipientAccountType: Sanitize.getAccountType(data.tpConta),
      recipientAccountNumber: Sanitize.accountNumber(data.nrConta),
      recipientCity: data.cidade,
      endToEndId,
      type,
      pss: isDefined(data.ispbFss) ? Sanitize.getIspb(data.ispbFss) : null,
      allowUpdate: !isDefined(data.valor),
      agentIspbWithdrawal: null,
      agentModWithdrawal: null,
      agentIspbChange: null,
      agentModChange: null,
      paymentValue: data.valor ? Sanitize.getInt(data.valor) : 0,
    };
  }

  private decodeQrCodeDynamic(
    endToEndId: string,
    data: JdpiQrCodeDynamic,
  ): DecodeQrCodePixPaymentPspResponse {
    let type = null;

    if (isDefined(data.ispbPssSaque)) {
      type = DecodedQrCodeType.QR_CODE_DYNAMIC_WITHDRAWAL;
    } else if (isDefined(data.ispbPssTroco)) {
      type = DecodedQrCodeType.QR_CODE_DYNAMIC_CHANGE;
    } else {
      type = DecodedQrCodeType.QR_CODE_DYNAMIC_INSTANT_PAYMENT;
    }

    const allowUpdateValue = isDefined(data.modalidadeAlteracao)
      ? Sanitize.getModalityUpdateType(data.modalidadeAlteracao)
      : false;

    const allowUpdateChange = isDefined(data.modalidadeAltTroco)
      ? Sanitize.getModalityUpdateType(data.modalidadeAltTroco)
      : false;

    const allowUpdateWithdrawal = isDefined(data.modalidadeAltSaque)
      ? Sanitize.getModalityUpdateType(data.modalidadeAltSaque)
      : false;

    const payerDocument =
      (data.cpfPagador || data.cnpjPagador) &&
      Sanitize.document(data.cpfPagador ?? data.cnpjPagador);

    return {
      key: data.chave,
      txId: data.idConciliacaoRecebedor,
      documentValue: data.valorOriginal
        ? Sanitize.getInt(data.valorOriginal)
        : 0,
      paymentValue: data.valorOriginal
        ? Sanitize.getInt(data.valorOriginal)
        : 0,
      additionalInfo: null,
      additionalInfos: data.dadosAdicionais?.map(({ nome, valor }) => ({
        name: nome,
        value: valor,
      })),
      recipientName:
        data.nomeRecebedor && Sanitize.fullName(data.nomeRecebedor),
      recipientPersonType: Sanitize.getPersonType(data.tpPessoaRecebedor),
      recipientDocument: formatDocument(
        data.cpfCnpjRecebedor,
        data.tpPessoaRecebedor,
      ),
      recipientIspb: isDefined(data.ispb) ? Sanitize.getIspb(data.ispb) : null,
      recipientBranch: data.nrAgencia && Sanitize.branch(data.nrAgencia),
      recipientAccountType: Sanitize.getAccountType(data.tpConta),
      recipientAccountNumber: Sanitize.accountNumber(data.nrConta),
      recipientCity: data.cidade,
      endToEndId,
      type,
      status: data.status?.toString(),
      pss: isDefined(data.ispbFss) ? Sanitize.getIspb(data.ispbFss) : null,
      allowUpdate:
        allowUpdateValue || allowUpdateWithdrawal || allowUpdateChange,
      agentIspbWithdrawal: isDefined(data.ispbPssSaque)
        ? Sanitize.getIspb(data.ispbPssSaque)
        : null,
      agentModWithdrawal: isDefined(data.modalidadeAgSaque)
        ? Sanitize.getAgentMod(data.modalidadeAgSaque)
        : null,
      agentIspbChange: isDefined(data.ispbPssTroco)
        ? Sanitize.getIspb(data.ispbPssTroco)
        : null,
      agentModChange: isDefined(data.modalidadeAgTroco)
        ? Sanitize.getAgentMod(data.modalidadeAgTroco)
        : null,
      changeValue: data.valorTroco && Sanitize.getInt(data.valorTroco),
      withdrawValue: data.valorSaque && Sanitize.getInt(data.valorSaque),
      payerDocument,
      payerName: data.nomePagador && Sanitize.fullName(data.nomePagador),
      payerPersonType: data.cpfPagador
        ? PersonType.NATURAL_PERSON
        : PersonType.LEGAL_PERSON,
    };
  }

  private decodeQrCodeDynamicDueDate(
    endToEndId: string,
    data: JdpiQrDynamicDueDate,
  ): DecodeQrCodePixPaymentPspResponse {
    const payerDocument =
      (data.cpfPagador || data.cnpjPagador) &&
      Sanitize.document(data.cpfPagador ?? data.cnpjPagador);

    return {
      key: data.chave,
      txId: data.idConciliacaoRecebedor,
      documentValue: data.valorOriginal
        ? Sanitize.getInt(data.valorOriginal)
        : 0,
      additionalInfo: null,
      additionalInfos: data.dadosAdicionais?.map(({ nome, valor }) => ({
        name: nome,
        value: valor,
      })),
      recipientName:
        data.nomeRecebedor && Sanitize.fullName(data.nomeRecebedor),
      recipientPersonType: Sanitize.getPersonType(data.tpPessoaRecebedor),
      recipientDocument: formatDocument(
        data.cpfCnpjRecebedor,
        data.tpPessoaRecebedor,
      ),
      recipientIspb: isDefined(data.ispb) ? Sanitize.getIspb(data.ispb) : null,
      recipientBranch: data.nrAgencia && Sanitize.branch(data.nrAgencia),
      recipientAccountType: Sanitize.getAccountType(data.tpConta),
      recipientAccountNumber: Sanitize.accountNumber(data.nrConta),
      recipientCity: data.cidade,
      endToEndId,
      type: DecodedQrCodeType.QR_CODE_DYNAMIC_DUE_DATE,
      status: data.status?.toString(),
      pss: isDefined(data.ispbFss) ? Sanitize.getIspb(data.ispbFss) : null,
      allowUpdate: false,
      agentIspbWithdrawal: null,
      agentModWithdrawal: null,
      agentIspbChange: null,
      agentModChange: null,
      interestValue: data.juros ? Sanitize.getInt(data.juros) : 0,
      fineValue: data.multa ? Sanitize.getInt(data.multa) : 0,
      deductionValue: data.abatimento ? Sanitize.getInt(data.abatimento) : 0,
      discountValue: data.desconto ? Sanitize.getInt(data.desconto) : 0,
      paymentValue: data.valorFinal ? Sanitize.getInt(data.valorFinal) : 0,
      version: data.revisao?.toString(),
      dueDate: data.dtVenc ? Sanitize.toDate(data.dtVenc) : null,
      payerDocument,
      payerName: data.nomePagador && Sanitize.fullName(data.nomePagador),
      payerPersonType: data.cpfPagador
        ? PersonType.NATURAL_PERSON
        : PersonType.LEGAL_PERSON,
    };
  }
}
