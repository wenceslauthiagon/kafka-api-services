import { Controller, Body, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { Logger } from 'winston';
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
  IsArray,
  IsOptional,
  ValidateNested,
  isDefined,
} from 'class-validator';
import {
  RequestId,
  formatValueFromFloatToInt,
  formatIspb,
  InjectLogger,
} from '@zro/common';
import { formatDocument } from '@zro/jdpi';
import {
  JdpiFinalityType,
  JdpiAgentModalityType,
  JdpiPaymentType,
  JdpiPersonType,
  JdpiPaymentPriorityType,
  JdpiPaymentPriorityLevelType,
  JdpiValueType,
} from '@zro/jdpi/domain';
import { THandleNotifyCreditDepositJdpiEventRequest } from '@zro/api-jdpi/interface';
import {
  NotifyCreditClient,
  NotifyCreditThirdPart,
  THandleNotifyCreditEventResponse,
  JdpiServiceKafka,
} from '@zro/api-jdpi/infrastructure';

type TNotifyCreditDepositAmountDetails = {
  vlrTarifaDinheiroCompra: number;
  tipo: JdpiValueType;
};

class NotifyCreditDepositAmountDetails
  implements TNotifyCreditDepositAmountDetails
{
  @ApiProperty({
    description: 'Buy value.',
    example: 100.5,
  })
  @Transform(
    (params) => params.value && formatValueFromFloatToInt(params.value),
  )
  vlrTarifaDinheiroCompra: number;

  @ApiProperty({
    description: 'Value type.',
    enum: JdpiValueType,
    example: JdpiValueType.PURCHASE,
  })
  tipo: JdpiValueType;
}

class NotifyCreditDepositBody {
  @ApiProperty({
    description: 'Jdpi request id.',
    example: '806ee933-0fdc-4ca9-b50f-3f9f4a8ed412',
  })
  idReqJdPi: string;

  @ApiProperty({
    description: 'End To End Id.',
    example: 'E0435879820200123221500000000001',
  })
  endToEndId: string;

  @ApiProperty({
    description: 'Initiation type.',
    enum: JdpiPaymentType,
    example: JdpiPaymentType.KEY,
  })
  tpIniciacao: JdpiPaymentType;

  @ApiProperty({
    description: 'Payment priority.',
    enum: JdpiPaymentPriorityType,
    example: JdpiPaymentPriorityType.PRIORITY,
  })
  prioridadePagamento: JdpiPaymentPriorityType;

  @ApiProperty({
    description: 'Payment priority type.',
    enum: JdpiPaymentPriorityLevelType,
    example: JdpiPaymentPriorityLevelType.PRIORITY_PAYMENT,
  })
  tpPrioridadePagamento: JdpiPaymentPriorityLevelType;

  @ApiProperty({
    description: 'Finality type.',
    enum: JdpiFinalityType,
    example: JdpiFinalityType.PIX_TRANSFER,
  })
  finalidade: JdpiFinalityType;

  @ApiPropertyOptional({
    description: 'Modality agent.',
    enum: JdpiAgentModalityType,
    example: JdpiAgentModalityType.COMMERCIAL_ESTABLISHMENT,
  })
  modalidadeAgente?: JdpiAgentModalityType;

  @ApiPropertyOptional({
    description: 'Withdraw service facilitator ispb.',
    example: 12345678,
  })
  ispbPss?: number;

  @ApiPropertyOptional({
    description: "Initiator institucion's cnpj.",
    example: 53688286000106,
  })
  cnpjIniciadorPagamento?: number;

  @ApiPropertyOptional({
    description: 'Beneficiary client conciliation Id.',
    example: 'REC00000000000000000000000000000001',
  })
  idConciliacaoRecebedor?: string;

  @ApiPropertyOptional({
    description: 'Pix key.',
    example: '6f015b48-0403-4c9e-b584-f6019b270f68',
  })
  chave?: string;

  @ApiProperty({
    description: 'Payer.',
    type: NotifyCreditThirdPart,
  })
  @Type(() => NotifyCreditThirdPart)
  pagador: NotifyCreditThirdPart;

  @ApiProperty({
    description: 'Beneficiary.',
    type: NotifyCreditClient,
  })
  @Type(() => NotifyCreditClient)
  recebedor: NotifyCreditClient;

  @ApiProperty({
    description: 'Operation date.',
    example: new Date(),
  })
  dtHrOp: Date;

  @ApiProperty({
    description: 'Credit deposit value.',
    example: 100.5,
  })
  @Transform(
    (params) => params.value && formatValueFromFloatToInt(params.value),
  )
  valor: number;

  @ApiPropertyOptional({
    description: 'Detail value.',
    example: NotifyCreditDepositAmountDetails,
    type: [NotifyCreditDepositAmountDetails],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotifyCreditDepositAmountDetails)
  vlrDetalhe?: NotifyCreditDepositAmountDetails[];

  @ApiPropertyOptional({
    description: 'Information between clients.',
    example: 'Paid Purchase',
  })
  infEntreClientes?: string;
}

class NotifyCreditDepositRestResponse
  implements THandleNotifyCreditEventResponse
{
  @ApiProperty({
    description: 'Jdpi request id.',
    example: '8a400aa7-7e9a-4b27-b62a-a06cfa37ff13',
  })
  idReqJdPi: string;

  @ApiProperty({
    description: 'Sgct credit Id.',
    example: '11131a0c-923c-4d81-bd21-a24340701a0b',
  })
  idCreditoSgct: string;

  @ApiProperty({
    description: 'Credit deposit createdAt.',
    example: new Date(),
  })
  dtHrCreditoSgct: Date;

  constructor(props: THandleNotifyCreditEventResponse) {
    this.idReqJdPi = props.idReqJdPi;
    this.idCreditoSgct = props.idCreditoSgct;
    this.dtHrCreditoSgct = props.dtHrCreditoSgct;
  }
}

/**
 * Notify credit controller.
 */
@ApiBearerAuth()
@ApiTags('Pix | Credit')
@Controller('pix/credit/deposit')
export class NotifyCreditDepositJdpiRestController {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param service JdpiServiceKafka Jdpi service.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly service: JdpiServiceKafka,
  ) {
    this.logger = logger.child({
      context: NotifyCreditDepositJdpiRestController.name,
    });
  }

  /**
   * Create notifyCreditDeposit endpoint.
   */
  @ApiOperation({
    summary: 'Notify credit deposit.',
    description: 'Creates a new pix deposit.',
  })
  @ApiOkResponse({
    description: 'Notification successfully received.',
    type: NotifyCreditDepositRestResponse,
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Post()
  @HttpCode(HttpStatus.OK)
  async execute(
    @Body() data: NotifyCreditDepositBody,
    @RequestId() requestId: string,
  ): Promise<NotifyCreditDepositRestResponse> {
    const logger = this.logger.child({ loggerId: requestId });

    // Create a payload.
    const payload: THandleNotifyCreditDepositJdpiEventRequest = {
      externalId: data.idReqJdPi,
      endToEndId: data.endToEndId,
      initiationType: data.tpIniciacao,
      paymentPriorityType: data.prioridadePagamento,
      paymentPriorityLevelType: data.tpPrioridadePagamento,
      finalityType: data.finalidade,
      ...(isDefined(data.modalidadeAgente) && {
        agentModalityType: data.modalidadeAgente,
      }),
      ...(isDefined(data.ispbPss) && { ispbPss: formatIspb(data.ispbPss) }),
      ...(data.cnpjIniciadorPagamento && {
        paymentInitiatorDocument: formatDocument(
          data.cnpjIniciadorPagamento,
          JdpiPersonType.LEGAL_PERSON,
        ),
      }),
      ...(data.idConciliacaoRecebedor && {
        clientConciliationId: data.idConciliacaoRecebedor,
      }),
      ...(data.chave && { key: data.chave }),
      thirdPartIspb:
        isDefined(data.pagador.ispb) && formatIspb(data.pagador.ispb),
      thirdPartPersonType: data.pagador.tpPessoa,
      thirdPartDocument:
        isDefined(data.pagador.tpPessoa) &&
        formatDocument(data.pagador.cpfCnpj, data.pagador.tpPessoa),
      ...(data.pagador.nrAgencia && {
        thirdPartBranch: data.pagador.nrAgencia,
      }),
      thirdPartAccountType: data.pagador.tpConta,
      thirdPartAccountNumber: data.pagador.nrConta,
      thirdPartName: data.pagador.nome,
      clientIspb:
        isDefined(data.recebedor.ispb) && formatIspb(data.recebedor.ispb),
      clientPersonType: data.recebedor.tpPessoa,
      clientDocument:
        isDefined(data.recebedor.tpPessoa) &&
        formatDocument(data.recebedor.cpfCnpj, data.recebedor.tpPessoa),
      ...(data.recebedor.nrAgencia && {
        clientBranch: data.recebedor.nrAgencia,
      }),
      clientAccountType: data.recebedor.tpConta,
      clientAccountNumber: data.recebedor.nrConta,
      amount: data.valor,
      ...(data.vlrDetalhe?.length && {
        amountDetails: data.vlrDetalhe.map((element) => ({
          fareBuyAmount: element.vlrTarifaDinheiroCompra,
          valueType: element.tipo,
        })),
      }),
      ...(data.infEntreClientes && {
        informationBetweenClients: data.infEntreClientes,
      }),
      createdAt: data.dtHrOp && new Date(data.dtHrOp),
    };

    logger.debug('Notify credit deposit in jdpi.', { payload });

    // Call create notify credit deposit in jdpi service.
    await this.service.notifyCreditDeposit(requestId, payload);

    const result: THandleNotifyCreditEventResponse = {
      idReqJdPi: payload.externalId,
      idCreditoSgct: payload.externalId,
      dtHrCreditoSgct: payload.createdAt,
    };

    logger.debug('Notify credit deposit.', { result });

    const response = new NotifyCreditDepositRestResponse(result);

    logger.debug('Notify credit created.');

    return response;
  }
}
