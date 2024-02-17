import { Logger } from 'winston';
import axios, { AxiosInstance } from 'axios';
import { cpfMask } from '@zro/common';
import {
  WebhookTargetGateway,
  WebhookTargetGatewayPixDevolutionReceivedRequest,
  WebhookTargetGatewayPaymentRequest,
  WebhookTargetGatewayResponse,
  WebhookTargetGatewayDepositReceivedRequest,
  WebhookTargetGatewayPixDevolutionCompletedRequest,
  GatewayWebhookException,
  WebhookTargetGatewayPaymentFailedRequest,
  WebhookTargetGatewayPixDevolutionFailedRequest,
} from '@zro/webhooks/application';

export enum WebhookClientPayloadTransactionType {
  PAYMENT = 'PAYMENT',
  DEVOLUTION = 'DEVOLUTION',
  DEPOSIT = 'DEPOSIT',
  DEVOLUTION_RECEIVED = 'DEVOLUTION_RECEIVED',
}

/* eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values */
export enum WebhookClientPayloadDocumentType {
  CPF = 'CPF',
  CNPJ = 'CNPJ',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  NATURAL_PERSON = 'CPF',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  LEGAL_PERSON = 'CNPJ',
}

export type WebhookClientPayload = {
  id: string;
  type: WebhookClientPayloadTransactionType;
  end_to_end_id: string;
  operation_id: string;
  txid?: string;
  amount: string;
  owner_name?: string;
  owner_person_type: WebhookClientPayloadDocumentType;
  owner_document?: string;
  owner_bank_name?: string;
  owner_bank_ispb?: string;
  beneficiary_name?: string;
  beneficiary_account_number?: string;
  beneficiary_person_type: WebhookClientPayloadDocumentType;
  beneficiary_document?: string;
  beneficiary_bank_name: string;
  beneficiary_bank_ispb: string;
  error_code?: string;
  error_description?: string;
  created_at: string;
};

// FIXME: Deveria vir da tabela do webhook um objeto pronto de autenticacao. Informando inclusive se é via header ou query.
const API_KEY_HEADER = 'X-API-KEY';

export class AxiosWebhookTargetGateway implements WebhookTargetGateway {
  axiosWebhook: AxiosInstance;

  constructor(private readonly logger: Logger) {
    this.logger = logger.child({ context: AxiosWebhookTargetGateway.name });

    // Set default config headers
    this.axiosWebhook = axios.create({
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // WARNING: Remove sensitive data!!!!
    this.axiosWebhook.interceptors.response.use(
      (response) => {
        delete response?.config?.headers?.[API_KEY_HEADER];

        return response;
      },
      (error) => {
        delete error?.response?.config?.headers?.[API_KEY_HEADER];

        return Promise.reject(error);
      },
    );
  }

  private formatDocument(
    documentType: WebhookClientPayloadDocumentType,
    document: string,
  ): string {
    return [
      WebhookClientPayloadDocumentType.CPF,
      WebhookClientPayloadDocumentType.NATURAL_PERSON,
    ].includes(WebhookClientPayloadDocumentType[documentType])
      ? cpfMask(document)
      : document;
  }

  private async sendToWebhookClient(
    url: string,
    data: WebhookClientPayload,
    apiKey: string,
  ): Promise<string> {
    this.logger.debug('Webhook request', { url, request: data });

    try {
      const response = await this.axiosWebhook.post(url, data, {
        headers: { [API_KEY_HEADER]: apiKey },
        // FIXME: Deveria ser algo configurável por env.
        timeout: 10000,
      });

      this.logger.debug('Webhook reponse', {
        url,
        request: data,
        status: response.status,
        response: response.data,
      });

      return response.status?.toString();
    } catch (error) {
      this.logger.error('ERROR Webhook request.', {
        error: error.isAxiosError ? error.message : error,
      });

      this.logger.error('Unexpected Webhook gateway error', {
        error: error.isAxiosError ? error.message : error,
        request: error.config,
        response: error.response?.data ?? error.response ?? error,
      });
      throw new GatewayWebhookException(error);
    }
  }

  async sendPaymentCompleted(
    url: string,
    apiKey: string,
    data: WebhookTargetGatewayPaymentRequest,
  ): Promise<WebhookTargetGatewayResponse> {
    this.logger.debug('Send payment completed request', { url, data });

    const ownerPersonType =
      WebhookClientPayloadDocumentType[data.ownerPersonType];
    const beneficiaryPersonType =
      WebhookClientPayloadDocumentType[data.beneficiaryPersonType];

    const ownerDocumentFormated = this.formatDocument(
      ownerPersonType,
      data.ownerDocument,
    );
    const beneficiaryDocumentFormated = this.formatDocument(
      beneficiaryPersonType,
      data.beneficiaryDocument,
    );

    const dataFormatted: WebhookClientPayload = {
      id: data.id,
      type: WebhookClientPayloadTransactionType.PAYMENT,
      end_to_end_id: data.endToEndId,
      txid: data.txId,
      operation_id: data.operationId,
      amount: data.value?.toString(),
      owner_name: data.ownerFullName,
      owner_person_type: ownerPersonType,
      owner_document: ownerDocumentFormated,
      beneficiary_name: data.beneficiaryName,
      beneficiary_person_type: beneficiaryPersonType,
      beneficiary_document: beneficiaryDocumentFormated,
      beneficiary_bank_name: data.beneficiaryBankName,
      beneficiary_bank_ispb: data.beneficiaryBankIspb,
      created_at: data.createdAt?.toString(),
    };

    try {
      const httpStatusCodeResponse = await this.sendToWebhookClient(
        url,
        dataFormatted,
        apiKey,
      );

      // FIXME: O Código e mensagem de resposta tem que ser salvo na base de dados
      return { httpStatusCodeResponse };
    } catch (error) {
      // FIXME: Precisa encapsular o erro em algum DefaultException. Não pode deixar uma excecao em um formato diferente!
      // FIXME: Tratar erro repetidas vezes não é a política mais adequada.
      // FIXME: O código e a mensagem de erro precisam ser salvas no banco de dados.
      this.logger.error('ERROR Axios request.', {
        error: error.isAxiosError ? error.message : error,
      });

      throw error;
    }
  }

  async sendPaymentFailed(
    url: string,
    apiKey: string,
    data: WebhookTargetGatewayPaymentFailedRequest,
  ): Promise<WebhookTargetGatewayResponse> {
    this.logger.debug('Send payment failed request', { url, data });

    const ownerPersonType =
      WebhookClientPayloadDocumentType[data?.ownerPersonType];
    const beneficiaryPersonType =
      WebhookClientPayloadDocumentType[data?.beneficiaryPersonType];

    const ownerDocumentFormated = this.formatDocument(
      ownerPersonType,
      data.ownerDocument,
    );
    const beneficiaryDocumentFormated = this.formatDocument(
      beneficiaryPersonType,
      data.beneficiaryDocument,
    );

    const dataFormatted: WebhookClientPayload = {
      id: data.id,
      type: WebhookClientPayloadTransactionType.PAYMENT,
      end_to_end_id: data?.endToEndId,
      txid: data.txId,
      operation_id: data?.operationId,
      amount: data.value?.toString(),
      owner_name: data?.ownerFullName,
      owner_person_type: ownerPersonType,
      owner_document: ownerDocumentFormated,
      beneficiary_name: data?.beneficiaryName,
      beneficiary_person_type: beneficiaryPersonType,
      beneficiary_document: beneficiaryDocumentFormated,
      beneficiary_bank_name: data?.beneficiaryBankName,
      beneficiary_bank_ispb: data?.beneficiaryBankIspb,
      error_code: data?.errorCode,
      error_description: data?.errorDescription,
      created_at: data.createdAt?.toString(),
    };

    try {
      const httpStatusCodeResponse = await this.sendToWebhookClient(
        url,
        dataFormatted,
        apiKey,
      );

      return { httpStatusCodeResponse };
    } catch (error) {
      this.logger.error('ERROR Axios request.', {
        error: error.isAxiosError ? error.message : error,
      });

      throw error;
    }
  }

  async sendDevolutionReceived(
    url: string,
    apiKey: string,
    data: WebhookTargetGatewayPixDevolutionReceivedRequest,
  ): Promise<WebhookTargetGatewayResponse> {
    this.logger.debug('Send devolution received request', { url, data });

    const ownerPersonType =
      WebhookClientPayloadDocumentType[data.thirdPartPersonType];
    const beneficiaryPersonType =
      WebhookClientPayloadDocumentType[data.clientPersonType];

    const ownerDocumentFormated = this.formatDocument(
      ownerPersonType,
      data.thirdPartDocument,
    );
    const beneficiaryDocumentFormated = this.formatDocument(
      beneficiaryPersonType,
      data.clientDocument,
    );

    // FIXME: Não faz sentido usar um DTO para dados desestruturados.
    const dataFormatted: WebhookClientPayload = {
      id: data.id,
      type: WebhookClientPayloadTransactionType.DEVOLUTION_RECEIVED,
      end_to_end_id: data.endToEndId,
      txid: data.txId,
      operation_id: data.operationId,
      amount: data.amount?.toString(),
      owner_name: data.thirdPartName,
      owner_person_type: ownerPersonType,
      owner_document: ownerDocumentFormated,
      owner_bank_name: data.thirdPartBankName,
      owner_bank_ispb: data.thirdPartBankIspb,
      beneficiary_name: data.clientName,
      beneficiary_person_type: beneficiaryPersonType,
      beneficiary_document: beneficiaryDocumentFormated,
      beneficiary_bank_name: data.clientBankName,
      beneficiary_bank_ispb: data.clientBankIspb,
      created_at: data.createdAt?.toString(),
    };

    try {
      const httpStatusCodeResponse = await this.sendToWebhookClient(
        url,
        dataFormatted,
        apiKey,
      );

      return { httpStatusCodeResponse };
    } catch (error) {
      this.logger.error('ERROR Axios request.', {
        error: error.isAxiosError ? error.message : error,
      });

      throw error;
    }
  }

  async sendDepositReceived(
    url: string,
    apiKey: string,
    data: WebhookTargetGatewayDepositReceivedRequest,
  ): Promise<WebhookTargetGatewayResponse> {
    this.logger.debug('Send deposit received request', { url, data });

    const ownerPersonType =
      WebhookClientPayloadDocumentType[data.thirdPartPersonType];
    const beneficiaryPersonType =
      WebhookClientPayloadDocumentType[data.clientPersonType];

    const beneficiaryDocumentFormated = this.formatDocument(
      beneficiaryPersonType,
      data.clientDocument,
    );

    const dataFormatted: WebhookClientPayload = {
      id: data.id,
      type: WebhookClientPayloadTransactionType.DEPOSIT,
      end_to_end_id: data.endToEndId,
      txid: data.txId,
      amount: data.amount?.toString(),
      operation_id: data.operationId,
      owner_name: data.thirdPartName,
      owner_person_type: ownerPersonType,
      owner_document: data.thirdPartDocument,
      owner_bank_name: data.thirdPartBankName,
      owner_bank_ispb: data.thirdPartBankIspb,
      beneficiary_name: data.clientName,
      beneficiary_account_number: data.clientAccountNumber,
      beneficiary_person_type: beneficiaryPersonType,
      beneficiary_document: beneficiaryDocumentFormated,
      beneficiary_bank_name: data.clientBankName,
      beneficiary_bank_ispb: data.clientBankIspb,
      created_at: data.createdAt?.toString(),
    };

    try {
      const httpStatusCodeResponse = await this.sendToWebhookClient(
        url,
        dataFormatted,
        apiKey,
      );

      return { httpStatusCodeResponse };
    } catch (error) {
      this.logger.error('ERROR Axios request.', {
        error: error.isAxiosError ? error.message : error,
      });

      throw error;
    }
  }

  async sendDevolutionCompleted(
    url: string,
    apiKey: string,
    data: WebhookTargetGatewayPixDevolutionCompletedRequest,
  ): Promise<WebhookTargetGatewayResponse> {
    this.logger.debug('Send devolution completed request', { url, data });

    const ownerPersonType =
      WebhookClientPayloadDocumentType[data.clientPersonType];
    const beneficiaryPersonType =
      WebhookClientPayloadDocumentType[data.thirdPartPersonType];

    const ownerDocumentFormated = this.formatDocument(
      ownerPersonType,
      data.clientDocument,
    );
    const beneficiaryDocumentFormated = this.formatDocument(
      beneficiaryPersonType,
      data.thirdPartDocument,
    );

    const dataFormatted: WebhookClientPayload = {
      id: data.id,
      type: WebhookClientPayloadTransactionType.DEVOLUTION,
      end_to_end_id: data.endToEndId,
      txid: data.txId,
      operation_id: data.operationId,
      amount: data.amount?.toString(),
      owner_name: data.clientName,
      owner_person_type: ownerPersonType,
      owner_document: ownerDocumentFormated,
      owner_bank_name: data.clientBankName,
      owner_bank_ispb: data.clientBankIspb,
      beneficiary_name: data.thirdPartName,
      beneficiary_person_type: beneficiaryPersonType,
      beneficiary_document: beneficiaryDocumentFormated,
      beneficiary_bank_name: data.thirdPartBankName,
      beneficiary_bank_ispb: data.thirdPartBankIspb,
      created_at: data.createdAt?.toString(),
    };

    try {
      const httpStatusCodeResponse = await this.sendToWebhookClient(
        url,
        dataFormatted,
        apiKey,
      );

      return { httpStatusCodeResponse };
    } catch (error) {
      this.logger.error('ERROR Axios request.', {
        error: error.isAxiosError ? error.message : error,
      });

      throw error;
    }
  }

  async sendDevolutionFailed(
    url: string,
    apiKey: string,
    data: WebhookTargetGatewayPixDevolutionFailedRequest,
  ): Promise<WebhookTargetGatewayResponse> {
    this.logger.debug('Send devolution failed request', { url, data });

    const ownerPersonType =
      WebhookClientPayloadDocumentType[data.thirdPartPersonType];
    const beneficiaryPersonType =
      WebhookClientPayloadDocumentType[data.clientPersonType];

    const ownerDocumentFormated = this.formatDocument(
      ownerPersonType,
      data.thirdPartDocument,
    );
    const beneficiaryDocumentFormated = this.formatDocument(
      beneficiaryPersonType,
      data.clientDocument,
    );

    const dataFormatted: WebhookClientPayload = {
      id: data.id,
      type: WebhookClientPayloadTransactionType.DEVOLUTION,
      end_to_end_id: data.endToEndId,
      txid: data.txId,
      operation_id: data.operationId,
      amount: data.amount?.toString(),
      owner_name: data.thirdPartName,
      owner_person_type: ownerPersonType,
      owner_document: ownerDocumentFormated,
      owner_bank_name: data.thirdPartBankName,
      owner_bank_ispb: data.thirdPartBankIspb,
      beneficiary_name: data.clientName,
      beneficiary_person_type: beneficiaryPersonType,
      beneficiary_document: beneficiaryDocumentFormated,
      beneficiary_bank_name: data.clientBankName,
      beneficiary_bank_ispb: data.clientBankIspb,
      error_code: data.errorCode,
      error_description: data.errorDescription,
      created_at: data.createdAt?.toString(),
    };

    try {
      const httpStatusCodeResponse = await this.sendToWebhookClient(
        url,
        dataFormatted,
        apiKey,
      );

      return { httpStatusCodeResponse };
    } catch (error) {
      this.logger.error('ERROR Axios request.', {
        error: error.isAxiosError ? error.message : error,
      });

      throw error;
    }
  }
}
