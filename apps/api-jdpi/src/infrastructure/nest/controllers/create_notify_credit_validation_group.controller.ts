import { v4 as uuidV4 } from 'uuid';
import { Controller, Body, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { Logger } from 'winston';
import { isDefined } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  ApiProperty,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiBearerAuth,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  formatIspb,
  LoggerParam,
  formatValueFromFloatToInt,
  formatBranch,
  RequestId,
} from '@zro/common';
import {
  JdpiAccountType,
  JdpiAgentModalityType,
  JdpiPersonType,
  JdpiPaymentPriorityType,
  JdpiValueType,
  JdpiPaymentPriorityLevelType,
  JdpiPaymentType,
  JdpiFinalityType,
  JdpiChannelType,
} from '@zro/jdpi/domain';
import { formatDocument } from '@zro/jdpi';
import { JdpiServiceKafka } from '@zro/api-jdpi/infrastructure';
import { THandleNotifyCreditValidationJdpiEventRequest } from '@zro/api-jdpi/interface';

class NotifyCreditValidationGroupClientBody {
  @ApiProperty({
    description: 'Client ispb.',
    example: 26264220,
  })
  ispb: number;

  @ApiProperty({
    description: 'Client person type',
    example: JdpiPersonType.NATURAL_PERSON,
  })
  tpPessoa: JdpiPersonType;

  @ApiProperty({
    description: 'Client document.',
    example: 8577432521,
  })
  @Transform((params) => params.value && String(params.value))
  cpfCnpj: number;

  @ApiPropertyOptional({ description: 'Client branch.', example: '1234' })
  @Transform((params) => params.value && formatBranch(params.value))
  nrAgencia?: string;

  @ApiProperty({
    description: 'Client account type.',
    example: JdpiAccountType.CACC,
  })
  tpConta: JdpiAccountType;

  @ApiProperty({
    description: 'Client account number.',
    example: '12341234',
  })
  nrConta: string;
}

class NotifyCreditValidationGroupThirdPartBody extends NotifyCreditValidationGroupClientBody {
  @ApiProperty({
    description: 'Third part name',
    example: 'John Doe',
  })
  nome: string;
}

class NotifyCreditValidationGroupDetailValueBody {
  @ApiProperty({
    description: 'Value of the purchase or cash available.',
    example: 12345.67,
  })
  @Transform(
    (params) => params.value && formatValueFromFloatToInt(params.value),
  )
  vlrTarifaDinheiroCompra: number;

  @ApiProperty({
    description: 'Type of value provided.',
    example: JdpiValueType.PURCHASE,
  })
  tipo: JdpiValueType;
}

class NotifyCreditValidationGroupCreditPaymentOrderBody {
  @ApiProperty({
    description: 'ID of the payment transaction.',
    example: '1234567890',
  })
  endToEndId: string;

  @ApiPropertyOptional({
    description: 'ID for receiver client reconciliation.',
    example: '5678901234567890',
  })
  idConciliacaoRecebedor?: string;

  @ApiPropertyOptional({
    description: 'Key for transactional account.',
    example: 'john.doe@email.com',
  })
  chave?: string;
}

class NotifyCreditValidationGroupItemBody {
  @ApiProperty({
    description: 'Initiation type.',
    example: JdpiPaymentType.KEY,
  })
  tpIniciacao: JdpiPaymentType;

  @ApiProperty({
    description: 'Priority payment.',
    example: JdpiPaymentPriorityType.NOT_PRIORITY,
  })
  prioridadePagamento: JdpiPaymentPriorityType;

  @ApiProperty({
    description: 'Type of priority payment.',
    example: JdpiPaymentPriorityLevelType.PAYMENT_UNDER_ANTI_FRAUD_ANALYSIS,
  })
  tpPrioridadePagamento: JdpiPaymentPriorityLevelType;

  @ApiProperty({
    description: 'Purpose of the transaction.',
    example: JdpiFinalityType.PIX_CHANGE,
  })
  finalidade: JdpiFinalityType;

  @ApiPropertyOptional({
    description: 'Modality of the withdrawing agent.',
    example: JdpiAgentModalityType.COMMERCIAL_ESTABLISHMENT,
  })
  modalidadeAgente?: JdpiAgentModalityType;

  @ApiPropertyOptional({
    description: 'ISPB of the withdraw service facilitator (PSS).',
    example: 12345678,
  })
  ispbPss?: number;

  @ApiPropertyOptional({
    description: 'CNPJ of the initiating institution of the payment.',
    example: 12345678901234,
  })
  cnpjIniciadorPagamento?: number;

  @ApiProperty({
    description: 'Third part data.',
    type: NotifyCreditValidationGroupThirdPartBody,
  })
  @Type(() => NotifyCreditValidationGroupThirdPartBody)
  pagador: NotifyCreditValidationGroupThirdPartBody;

  @ApiProperty({
    description: 'Client data.',
    type: NotifyCreditValidationGroupClientBody,
  })
  @Type(() => NotifyCreditValidationGroupClientBody)
  recebedor: NotifyCreditValidationGroupClientBody;

  @ApiProperty({
    description: 'Moment when the devolution order was informed.',
    example: new Date(),
  })
  dtHrOp: Date;

  @ApiProperty({
    description: 'Transaction amount.',
    example: 12345.67,
  })
  @Transform(
    (params) => params.value && formatValueFromFloatToInt(params.value),
  )
  valor: number;

  @ApiPropertyOptional({
    description: 'Details of the payment values.',
    type: [NotifyCreditValidationGroupDetailValueBody],
  })
  @Type(() => NotifyCreditValidationGroupDetailValueBody)
  vlrDetalhe?: NotifyCreditValidationGroupDetailValueBody[];

  @ApiPropertyOptional({
    description: 'Information between clients.',
    example: 'Some information between clients.',
  })
  infEntreClientes?: string;

  @ApiPropertyOptional({
    description: 'Credit payment order data.',
    type: NotifyCreditValidationGroupCreditPaymentOrderBody,
  })
  @Type(() => NotifyCreditValidationGroupCreditPaymentOrderBody)
  creditoOrdemPagamento?: NotifyCreditValidationGroupCreditPaymentOrderBody;
}

class NotifyCreditValidationGroupBody {
  @ApiProperty({
    description: 'Channel type.',
    example: JdpiChannelType.CSM,
  })
  tpCanal: JdpiChannelType;

  @ApiProperty({
    description: 'Group of credits.',
    type: [NotifyCreditValidationGroupItemBody],
  })
  @Type(() => NotifyCreditValidationGroupItemBody)
  creditos: NotifyCreditValidationGroupItemBody[];
}

export type TNotifyCreditValidationGroupRestResponse = {
  idValidacaoSgct: string;
  dtHrAvisoSgct: Date;
};

class NotifyCreditValidationGroupRestResponse {
  @ApiProperty({
    description: 'Credit validation group Id.',
    example: '87fd0287-9ae5-4089-9a5c-b7c0ae861063',
  })
  idValidacaoSgct: string;

  @ApiProperty({
    description: 'Credit validation createdAt.',
    example: new Date(),
  })
  dtHrAvisoSgct: Date;

  constructor(props: TNotifyCreditValidationGroupRestResponse) {
    this.idValidacaoSgct = props.idValidacaoSgct;
    this.dtHrAvisoSgct = props.dtHrAvisoSgct;
  }
}

/**
 * Notify credit validation group controller.
 */
@ApiBearerAuth()
@ApiTags('Pix | Credit')
@Controller('pix/credit/verify/group')
export class NotifyCreditValidationGroupJdpiRestController {
  /**
   * Default constructor.

   * @param service JdpiServiceKafka Jdpi service.
   */
  constructor(private readonly service: JdpiServiceKafka) {}

  /**
   * Create notifyCreditValidationGroup endpoint.
   */
  @ApiOperation({
    summary: 'Notify credit validation group.',
    description: 'Verify a new batch pix received.',
  })
  @ApiOperation({
    description: 'Notify credit validation group.',
  })
  @ApiOkResponse({
    description: 'Notification successfully received.',
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing, has invalid format or type.',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'If any required params are missing, has invalid format or type.',
  })
  @Post()
  @HttpCode(HttpStatus.OK)
  async execute(
    @Body() data: NotifyCreditValidationGroupBody,
    @RequestId() requestId: string,
    @LoggerParam(NotifyCreditValidationGroupJdpiRestController)
    logger: Logger,
  ): Promise<NotifyCreditValidationGroupRestResponse> {
    logger.debug('Notify credit validations received.', {
      length: data.creditos.length,
    });

    const groupId = uuidV4();

    for (const credit of data.creditos) {
      // Create a payload.
      const payload: THandleNotifyCreditValidationJdpiEventRequest = {
        id: uuidV4(),
        groupId,
        initiationType: credit.tpIniciacao,
        paymentPriorityType: credit.prioridadePagamento,
        paymentPriorityLevelType: credit.tpPrioridadePagamento,
        finalityType: credit.finalidade,
        ...(isDefined(credit.modalidadeAgente) && {
          agentModalityType: credit.modalidadeAgente,
        }),
        ...(isDefined(credit.ispbPss) && {
          ispbPss: formatIspb(credit.ispbPss),
        }),
        ...(credit.cnpjIniciadorPagamento && {
          paymentInitiatorDocument: formatDocument(
            credit.cnpjIniciadorPagamento,
            JdpiPersonType.LEGAL_PERSON,
          ),
        }),
        thirdPartIspb: formatIspb(credit.pagador.ispb),
        thirdPartPersonType: credit.pagador.tpPessoa,
        thirdPartDocument: formatDocument(
          credit.pagador.cpfCnpj,
          credit.pagador.tpPessoa,
        ),
        thirdPartName: credit.pagador.nome,
        ...(credit.pagador.nrAgencia && {
          thirdPartBranch: credit.pagador.nrAgencia,
        }),
        thirdPartAccountType: credit.pagador.tpConta,
        thirdPartAccountNumber: credit.pagador.nrConta,
        clientIspb: formatIspb(credit.recebedor.ispb),
        clientPersonType: credit.recebedor.tpPessoa,
        clientDocument: formatDocument(
          credit.recebedor.cpfCnpj,
          credit.recebedor.tpPessoa,
        ),
        ...(credit.recebedor.nrAgencia && {
          clientBranch: credit.recebedor.nrAgencia,
        }),
        clientAccountType: credit.recebedor.tpConta,
        clientAccountNumber: credit.recebedor.nrConta,
        amount: credit.valor,
        ...(credit.vlrDetalhe?.length && {
          amountDetails: credit.vlrDetalhe.map((amountDetail) => ({
            fareBuyAmount: amountDetail.vlrTarifaDinheiroCompra,
            valueType: amountDetail.tipo,
          })),
        }),
        ...(credit.infEntreClientes && {
          informationBetweenClients: credit.infEntreClientes,
        }),
        ...(credit.creditoOrdemPagamento && {
          endToEndId: credit.creditoOrdemPagamento.endToEndId,
          ...(credit.creditoOrdemPagamento.idConciliacaoRecebedor && {
            clientConciliationId:
              credit.creditoOrdemPagamento.idConciliacaoRecebedor,
          }),
          ...(credit.creditoOrdemPagamento.chave && {
            key: credit.creditoOrdemPagamento.chave,
          }),
        }),
      };

      logger.debug('Notify credit validation.', { payload });

      // Call create jpdi service.
      await this.service.notifyCreditValidation(requestId, payload);
    }

    const result: TNotifyCreditValidationGroupRestResponse = {
      idValidacaoSgct: groupId,
      dtHrAvisoSgct: new Date(),
    };

    const response = new NotifyCreditValidationGroupRestResponse(result);

    logger.debug('Notify credit validation group created.');

    return response;
  }
}
