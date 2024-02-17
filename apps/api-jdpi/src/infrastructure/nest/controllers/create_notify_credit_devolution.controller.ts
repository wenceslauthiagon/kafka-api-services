import { Logger } from 'winston';
import { Transform, Type } from 'class-transformer';
import { Controller, Body, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { isDefined } from 'class-validator';
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
  RequestId,
  InjectLogger,
  formatIspb,
  formatValueFromFloatToInt,
} from '@zro/common';
import { formatDocument } from '@zro/jdpi';
import { THandleNotifyCreditDevolutionJdpiEventRequest } from '@zro/api-jdpi/interface';
import {
  NotifyCreditClient,
  NotifyCreditThirdPart,
  THandleNotifyCreditEventResponse,
  JdpiServiceKafka,
} from '@zro/api-jdpi/infrastructure';

class NotifyCreditDevolutionBody {
  @ApiProperty({
    description: 'Jdpi request id.',
    example: '06416d11-e939-456d-a922-7335257a24ea',
  })
  idReqJdPi: string;

  @ApiProperty({
    description: 'End To End Id.',
    example: 'E0435879820200123221500000000001',
  })
  endToEndIdOriginal: string;

  @ApiProperty({
    description: 'Devolution End To End Id.',
    example: 'D0435879820200123221500000000002',
  })
  endToEndIdDevolucao: string;

  @ApiProperty({
    description: 'Devolution code.',
    example: 'BE08',
  })
  codigoDevolucao: string;

  @ApiPropertyOptional({
    description: 'Devolution reason.',
    example: 'Refund',
  })
  motivoDevolucao?: string;

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
    description: 'Credit devolution value.',
    example: 150.85,
  })
  @Transform(
    (params) => params.value && formatValueFromFloatToInt(params.value),
  )
  valor: number;

  @ApiPropertyOptional({
    description: 'information between clients.',
    example: 'Returning purchase value',
  })
  infEntreClientes?: string;
}

class NotifyCreditDevolutionRestResponse
  implements THandleNotifyCreditEventResponse
{
  @ApiProperty({
    description: 'Jdpi request id.',
    example: '6e6defed-bd16-477c-9c8e-fafbcfa7f777',
  })
  idReqJdPi: string;

  @ApiProperty({
    description: 'Sgct credit Id.',
    example: '87fd0287-9ae5-4089-9a5c-b7c0ae861063',
  })
  idCreditoSgct: string;

  @ApiProperty({
    description: 'Operation createdAt.',
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
 * Notify credit devolution controller.
 */
@ApiBearerAuth()
@ApiTags('Pix | Credit')
@Controller('pix/credit/devolution')
export class NotifyCreditDevolutionJdpiRestController {
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
      context: NotifyCreditDevolutionJdpiRestController.name,
    });
  }

  /**
   * Create notifyCreditDevolution endpoint.
   */
  @ApiOperation({
    summary: 'Notify credit devolution.',
    description: 'Creates a new pix devolution received.',
  })
  @ApiOkResponse({
    description: 'Notification successfully received.',
    type: NotifyCreditDevolutionRestResponse,
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
    @Body() data: NotifyCreditDevolutionBody,
    @RequestId() requestId: string,
  ): Promise<NotifyCreditDevolutionRestResponse> {
    const logger = this.logger.child({ loggerId: requestId });

    // Create a payload.
    const payload: THandleNotifyCreditDevolutionJdpiEventRequest = {
      externalId: data.idReqJdPi,
      originalEndToEndId: data.endToEndIdOriginal,
      devolutionEndToEndId: data.endToEndIdDevolucao,
      devolutionCode: data.codigoDevolucao,
      devolutionReason: data.motivoDevolucao,
      thirdPartIspb:
        isDefined(data.recebedor.ispb) && formatIspb(data.recebedor.ispb),
      thirdPartPersonType: data.recebedor.tpPessoa,
      thirdPartDocument:
        data.recebedor.cpfCnpj &&
        isDefined(data.recebedor.tpPessoa) &&
        formatDocument(data.recebedor.cpfCnpj, data.recebedor.tpPessoa),
      ...(data.recebedor.nrAgencia && {
        thirdPartBranch: data.recebedor.nrAgencia,
      }),
      thirdPartAccountType: data.recebedor.tpConta,
      thirdPartAccountNumber: data.recebedor.nrConta,
      thirdPartName: '', // FIXME: Turn opcional.
      clientIspb: isDefined(data.pagador.ispb) && formatIspb(data.pagador.ispb),
      clientPersonType: data.pagador.tpPessoa,
      clientDocument:
        data.pagador.cpfCnpj &&
        isDefined(data.pagador.tpPessoa) &&
        formatDocument(data.pagador.cpfCnpj, data.pagador.tpPessoa),
      ...(data.pagador.nrAgencia && {
        clientBranch: data.pagador.nrAgencia,
      }),
      clientAccountType: data.pagador.tpConta,
      clientAccountNumber: data.pagador.nrConta,
      amount: data.valor,
      ...(data.infEntreClientes && {
        informationBetweenClients: data.infEntreClientes,
      }),
      createdAt: data.dtHrOp && new Date(data.dtHrOp),
    };
    logger.debug('Notify credit devolution in jdpi.', { payload });

    // Call create jpdi service.
    await this.service.notifyCreditDevolution(requestId, payload);

    const result: THandleNotifyCreditEventResponse = {
      idReqJdPi: payload.externalId,
      idCreditoSgct: payload.externalId,
      dtHrCreditoSgct: payload.createdAt,
    };

    logger.debug('Notify credit devolution.', { result });

    const response = new NotifyCreditDevolutionRestResponse(result);

    logger.debug('Notify credit devolution created.');

    return response;
  }
}
