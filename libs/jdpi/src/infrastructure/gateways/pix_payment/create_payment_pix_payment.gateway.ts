import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { isDefined } from 'class-validator';
import { MissingDataException } from '@zro/common';
import { PaymentType } from '@zro/pix-payments/domain';
import {
  JdpiAccountType,
  JdpiErrorTypes,
  JdpiPaymentType,
  JdpiAgentModalityType,
  JdpiPersonType,
  JdpiPaymentPriorityType,
  JdpiPaymentPriorityLevelType,
  JdpiValueType,
  JdpiFinalityType,
  JdpiChannelType,
} from '@zro/jdpi/domain';
import {
  CreatePaymentPixPaymentPspRequest,
  CreatePaymentPixPaymentPspResponse,
  OfflinePixPaymentPspException,
  PixPaymentGateway,
  PixPaymentPspException,
} from '@zro/pix-payments/application';
import {
  JdpiAuthGateway,
  Sanitize,
  JDPI_SERVICES,
} from '@zro/jdpi/infrastructure';

interface JdpiPerson {
  ispb: number;
  tpPessoa: JdpiPersonType;
  cpfCnpj: number;
  nome: string;
  nrAgencia?: string;
  tpConta: JdpiAccountType;
  nrConta: string;
}

interface JdpiAmountDetails {
  vlrTarifaDinheiroCompra: number;
  tipo: JdpiValueType;
}

export interface JdpiCreatePaymentPixPaymentRequest {
  idReqSistemaCliente: string;
  dtHrRequisicaoPsp: Date;
  tpIniciacao: JdpiPaymentType;
  prioridadePagamento: JdpiPaymentPriorityType;
  tpPrioridadePagamento: JdpiPaymentPriorityLevelType;
  finalidade: JdpiFinalityType;
  modalidadeAgente?: JdpiAgentModalityType;
  ispbPss?: number;
  cnpjIniciadorPagamento?: number;
  pagador: JdpiPerson;
  recebedor: JdpiPerson;
  valor: number;
  vlrDetalhe: JdpiAmountDetails[];
  chave?: string;
  endToEndId?: string;
  idConciliacaoRecebedor?: string;
  infEntreClientes?: string;
}

export interface JdpiCreatePaymentPixPaymentResponse {
  idReqSistemaCliente: string;
  idReqJdPi: string;
  endToEndId: string;
  dtHrReqJdPi: Date;
  tpCanal: JdpiChannelType;
}

export class JdpiCreatePaymentPixPaymentPspGateway
  implements Pick<PixPaymentGateway, 'createPayment'>
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: JdpiCreatePaymentPixPaymentPspGateway.name,
    });
  }

  async createPayment(
    request: CreatePaymentPixPaymentPspRequest,
  ): Promise<CreatePaymentPixPaymentPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const finalityType = Sanitize.parsePaymentTypeToFinality(
      request.paymentType,
    );

    const payload: JdpiCreatePaymentPixPaymentRequest = {
      idReqSistemaCliente: request.paymentId,
      dtHrRequisicaoPsp: new Date(), // FIXME: use the right datetime
      tpIniciacao: Sanitize.parsePaymentType(request.paymentType),
      prioridadePagamento: Sanitize.parsePaymentPriority(request.priorityType),
      tpPrioridadePagamento: Sanitize.parsePaymentPriorityLevel(
        request.priorityType,
      ),
      finalidade: Sanitize.parsePaymentTypeToFinality(request.paymentType),
      ...(finalityType !== JdpiFinalityType.PIX_TRANSFER &&
        request.agentMod && {
          modalidadeAgente: Sanitize.parseAgentMod(request.agentMod),
        }),
      ...(isDefined(request.agentIspb) && {
        ispbPss: Sanitize.parseIspb(request.agentIspb),
      }),
      pagador: {
        ispb: Sanitize.parseIspb(request.ispb),
        tpPessoa: Sanitize.parsePersonType(request.ownerPersonType),
        cpfCnpj: Sanitize.parseDocument(request.ownerDocument),
        nome: Sanitize.fullName(request.ownerName),
        ...(request.ownerBranch && {
          nrAgencia: Sanitize.branch(request.ownerBranch),
        }),
        tpConta: JdpiAccountType.CACC,
        nrConta: Sanitize.accountNumber(request.ownerAccountNumber),
      },
      recebedor: {
        ispb: Sanitize.parseIspb(request.beneficiaryBankIspb),
        tpPessoa: Sanitize.parsePersonType(request.beneficiaryPersonType),
        cpfCnpj: Sanitize.parseDocument(request.beneficiaryDocument),
        nome: Sanitize.fullName(request.beneficiaryName),
        ...(request.beneficiaryBranch && {
          nrAgencia: Sanitize.branch(request.beneficiaryBranch),
        }),
        tpConta: Sanitize.parseAccountType(request.beneficiaryAccountType),
        nrConta: Sanitize.accountNumber(request.beneficiaryAccountNumber),
      },
      valor: Sanitize.parseValue(request.value),
      ...(finalityType !== JdpiFinalityType.PIX_TRANSFER && {
        vlrDetalhe: [
          {
            vlrTarifaDinheiroCompra: Sanitize.parseValue(request.value),
            tipo: JdpiValueType.RESOURCE,
          },
          ...(finalityType !== JdpiFinalityType.PIX_CHANGE && [
            {
              vlrTarifaDinheiroCompra: Sanitize.parseValue(request.value),
              tipo: JdpiValueType.PURCHASE,
            },
          ]),
        ],
      }),
      ...(request.beneficiaryKey && { chave: request.beneficiaryKey }),
      ...(request.paymentType !== PaymentType.ACCOUNT && {
        endToEndId: request.endToEndId,
      }),
      ...(request.txId && {
        idConciliacaoRecebedor: Sanitize.txId(request.txId),
      }),
      ...(request.description && {
        infEntreClientes: Sanitize.description(request.description),
      }),
    };

    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
      'Chave-Idempotencia': request.paymentId,
    };

    this.logger.info('Request payload and headers.', {
      payload,
      headers: { 'Chave-Idempotencia': request.paymentId },
    });

    try {
      const response =
        await this.axios.post<JdpiCreatePaymentPixPaymentResponse>(
          JDPI_SERVICES.PIX_PAYMENT.PAYMENT,
          payload,
          { headers },
        );

      this.logger.info('Response found.', { data: response.data });

      return {
        externalId: response.data.idReqJdPi,
        endToEndId: response.data.endToEndId,
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
