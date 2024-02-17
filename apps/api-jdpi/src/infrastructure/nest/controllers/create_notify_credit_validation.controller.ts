import { v4 as uuidV4 } from 'uuid';
import { Controller, Body, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { Logger } from 'winston';
import { isDefined } from 'class-validator';
import { ConfigService } from '@nestjs/config';
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
  MissingEnvVarException,
  formatIspb,
  KafkaServiceParam,
  LoggerParam,
  EventEmitterParam,
  formatValueFromFloatToInt,
  formatBranch,
  RedisService,
} from '@zro/common';
import { PixDevolutionCode } from '@zro/pix-payments/domain';
import {
  JdpiAccountType,
  JdpiAgentModalityType,
  JdpiResultType,
  JdpiPersonType,
  JdpiPaymentPriorityType,
  JdpiValueType,
  JdpiPaymentPriorityLevelType,
  JdpiPaymentType,
  JdpiFinalityType,
  JdpiErrorCode,
} from '@zro/jdpi/domain';
import { formatDocument } from '@zro/jdpi';
import {
  NotifyCreditValidationController,
  NotifyCreditValidationEventEmitterControllerInterface,
  NotifyCreditValidationRequest,
  NotifyCreditValidationResponse,
  Parse,
} from '@zro/api-jdpi/interface';
import {
  NotifyCreditValidationEventKafkaEmitter,
  NotifyCreditValidationRedisRepository,
  PixPaymentServiceKafka,
  QrCodeStaticRedisRepository,
  UserServiceKafka,
} from '@zro/api-jdpi/infrastructure';

class NotifyCreditValidationClientBody {
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

class NotifyCreditValidationThirdPartBody extends NotifyCreditValidationClientBody {
  @ApiProperty({
    description: 'Third part name',
    example: 'John Doe',
  })
  nome: string;
}

class NotifyCreditValidationDetailValueBody {
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

class NotifyCreditValidationCreditPaymentOrderBody {
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

class NotifyCreditValidationDevoluitonCreditBody {
  @ApiProperty({
    description: 'ID of the payment transaction.',
    example: '12345678901234567890123456789012',
  })
  endToEndIdOriginal: string;

  @ApiProperty({
    description: 'ID of the devolution transaction.',
    example: '98765432109876543210987654321098',
  })
  endToEndIdDevolucao: string;

  @ApiProperty({
    description: 'Devolution code',
    example: PixDevolutionCode.FRAUD,
  })
  codigoDevolucao: PixDevolutionCode;

  @ApiPropertyOptional({
    description: 'Devolution reason.',
    example: 'Failed transaction due to technical issue.',
  })
  motivoDevolucao?: string;
}

class NotifyCreditValidationBody {
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
    type: NotifyCreditValidationThirdPartBody,
  })
  @Type(() => NotifyCreditValidationThirdPartBody)
  pagador: NotifyCreditValidationThirdPartBody;

  @ApiProperty({
    description: 'Client data.',
    type: NotifyCreditValidationClientBody,
  })
  @Type(() => NotifyCreditValidationClientBody)
  recebedor: NotifyCreditValidationClientBody;

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
    type: [NotifyCreditValidationDetailValueBody],
  })
  @Type(() => NotifyCreditValidationDetailValueBody)
  vlrDetalhe?: NotifyCreditValidationDetailValueBody[];

  @ApiPropertyOptional({
    description: 'Information between clients.',
    example: 'Some information between clients.',
  })
  infEntreClientes?: string;

  @ApiPropertyOptional({
    description: 'Credit payment order data.',
    type: NotifyCreditValidationCreditPaymentOrderBody,
  })
  @Type(() => NotifyCreditValidationCreditPaymentOrderBody)
  creditoOrdemPagamento?: NotifyCreditValidationCreditPaymentOrderBody;

  @ApiPropertyOptional({
    description: 'Credit devolution data.',
    type: NotifyCreditValidationDevoluitonCreditBody,
  })
  @Type(() => NotifyCreditValidationDevoluitonCreditBody)
  creditoDevolucao?: NotifyCreditValidationDevoluitonCreditBody;
}

class NotifyCreditValidationRestResponse {
  @ApiProperty({
    description: 'Credit validation result.',
    example: JdpiResultType.VALID,
  })
  resultado: JdpiResultType;

  @ApiPropertyOptional({
    description: 'Credit validation reason.',
    example: JdpiErrorCode.AB03,
  })
  motivo?: JdpiErrorCode;

  @ApiPropertyOptional({
    description: 'Credit validation reason complement.',
    example: 'Account was blocked because suspected fraud.',
  })
  motivoComplemento?: string;

  @ApiProperty({
    description: 'Credit validation date.',
    example: new Date(),
  })
  dtHrValidacao: Date;

  constructor(props: NotifyCreditValidationResponse) {
    this.resultado = Parse.parseResultType(props.resultType);
    this.motivo = props.devolutionCode;
    this.motivoComplemento = props.description;
    this.dtHrValidacao = props.createdAt;
  }
}

interface NotifyCreditValidationConfig {
  APP_ZROBANK_ISPB: string;
  APP_NOTIFY_CREDIT_VALIDATION_CACHE_TTL_SEC: number;
}

/**
 * Notify credit validation controller.
 */
@ApiBearerAuth()
@ApiTags('Pix | Credit')
@Controller('pix/credit/verify')
export class NotifyCreditValidationJdpiRestController {
  private readonly zroIspbCode: string;
  private readonly notifyCreditValidationCacheRepository: NotifyCreditValidationRedisRepository;
  private readonly qrCodeStaticCacheRepository: QrCodeStaticRedisRepository;

  constructor(
    configService: ConfigService<NotifyCreditValidationConfig>,
    redisService: RedisService,
  ) {
    this.zroIspbCode = configService.get<string>('APP_ZROBANK_ISPB');

    if (!this.zroIspbCode) {
      throw new MissingEnvVarException(['APP_ZROBANK_ISPB']);
    }

    const notifyCreditValidationCacheTTL =
      Number(
        configService.get<number>(
          'APP_NOTIFY_CREDIT_VALIDATION_CACHE_TTL_SEC',
        ) || 600,
      ) * 1000;

    this.notifyCreditValidationCacheRepository =
      new NotifyCreditValidationRedisRepository(
        redisService,
        notifyCreditValidationCacheTTL,
      );
    this.qrCodeStaticCacheRepository = new QrCodeStaticRedisRepository(
      redisService,
    );
  }

  /**
   * Create notifyCreditValidation endpoint.
   */
  @ApiOperation({
    summary: 'Notify credit validation.',
    description: 'Verify a new pix received.',
  })
  @ApiOperation({
    description: 'Notify credit validation.',
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
    @Body() data: NotifyCreditValidationBody,
    @EventEmitterParam(NotifyCreditValidationEventKafkaEmitter)
    serviceEventEmitter: NotifyCreditValidationEventEmitterControllerInterface,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
    @KafkaServiceParam(PixPaymentServiceKafka)
    pixPaymentService: PixPaymentServiceKafka,
    @LoggerParam(NotifyCreditValidationJdpiRestController)
    logger: Logger,
  ): Promise<NotifyCreditValidationRestResponse> {
    // Create a payload.
    const payload: NotifyCreditValidationRequest = {
      id: uuidV4(),
      initiationType: data.tpIniciacao,
      paymentPriorityType: data.prioridadePagamento,
      paymentPriorityLevelType: data.tpPrioridadePagamento,
      finalityType: data.finalidade,
      ...(isDefined(data.modalidadeAgente) && {
        agentModalityType: data.modalidadeAgente,
      }),
      ...(isDefined(data.ispbPss) && {
        ispbPss: formatIspb(data.ispbPss),
      }),
      ...(data.cnpjIniciadorPagamento && {
        paymentInitiatorDocument: formatDocument(
          data.cnpjIniciadorPagamento,
          JdpiPersonType.LEGAL_PERSON,
        ),
      }),
      thirdPartIspb: formatIspb(data.pagador.ispb),
      thirdPartPersonType: data.pagador.tpPessoa,
      thirdPartDocument: formatDocument(
        data.pagador.cpfCnpj,
        data.pagador.tpPessoa,
      ),
      thirdPartName: data.pagador.nome,
      ...(data.pagador.nrAgencia && {
        thirdPartBranch: data.pagador.nrAgencia,
      }),
      thirdPartAccountType: data.pagador.tpConta,
      thirdPartAccountNumber: data.pagador.nrConta,
      clientIspb: formatIspb(data.recebedor.ispb),
      clientPersonType: data.recebedor.tpPessoa,
      clientDocument: formatDocument(
        data.recebedor.cpfCnpj,
        data.recebedor.tpPessoa,
      ),
      ...(data.recebedor.nrAgencia && {
        clientBranch: data.recebedor.nrAgencia,
      }),
      clientAccountType: data.recebedor.tpConta,
      clientAccountNumber: data.recebedor.nrConta,
      amount: data.valor,
      ...(data.vlrDetalhe?.length && {
        amountDetails: data.vlrDetalhe.map((amountDetail) => ({
          fareBuyAmount: amountDetail.vlrTarifaDinheiroCompra,
          valueType: amountDetail.tipo,
        })),
      }),
      ...(data.infEntreClientes && {
        informationBetweenClients: data.infEntreClientes,
      }),
      ...(data.creditoOrdemPagamento && {
        endToEndId: data.creditoOrdemPagamento.endToEndId,
        ...(data.creditoOrdemPagamento.idConciliacaoRecebedor && {
          clientConciliationId:
            data.creditoOrdemPagamento.idConciliacaoRecebedor,
        }),
        ...(data.creditoOrdemPagamento.chave && {
          key: data.creditoOrdemPagamento.chave,
        }),
      }),
      ...(data.creditoDevolucao && {
        originalEndToEndId: data.creditoDevolucao.endToEndIdOriginal,
        devolutionEndToEndId: data.creditoDevolucao.endToEndIdDevolucao,
        devolutionCode: data.creditoDevolucao.codigoDevolucao,
        ...(data.creditoDevolucao.motivoDevolucao && {
          devolutionReason: data.creditoDevolucao.motivoDevolucao,
        }),
      }),
    };

    logger.debug('Notify credit validation.', { payload });

    const controller = new NotifyCreditValidationController(
      logger,
      this.notifyCreditValidationCacheRepository,
      this.qrCodeStaticCacheRepository,
      serviceEventEmitter,
      userService,
      pixPaymentService,
      this.zroIspbCode,
    );

    const result = await controller.execute(payload);

    logger.debug('Notify credit validation created.', { result });

    const response = new NotifyCreditValidationRestResponse(result);

    return response;
  }
}
