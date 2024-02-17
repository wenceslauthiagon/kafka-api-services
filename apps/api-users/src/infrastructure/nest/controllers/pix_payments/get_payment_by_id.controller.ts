import { Controller, Param, Get } from '@nestjs/common';
import { Logger } from 'winston';
import { IsUUID } from 'class-validator';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthWallet } from '@zro/operations/domain';
import { PaymentState } from '@zro/pix-payments/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  GetPaymentByIdRequest,
  GetPaymentByIdResponse,
} from '@zro/pix-payments/interface';
import { GetPaymentByIdServiceKafka } from '@zro/pix-payments/infrastructure';
import {
  AuthWalletParam,
  WalletApiHeader,
} from '@zro/operations/infrastructure';

class GetPaymentByIdParams {
  @ApiProperty({
    description: 'Payment UUID.',
  })
  @IsUUID(4)
  id!: string;
}

class GetPaymentByIdRestResponse {
  @ApiProperty({
    description: 'Payment UUID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiPropertyOptional({
    description:
      'Statement UUID. This will not be returned if the payment was scheduled.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
    required: false,
  })
  operation_id?: string;

  @ApiProperty({
    enum: PaymentState,
    description: 'Payment state.',
    example: PaymentState.PENDING,
  })
  state!: PaymentState;

  @ApiProperty({
    description: 'Value in R$ cents.',
    example: 1299,
  })
  value!: number;

  @ApiPropertyOptional({
    description:
      'Schedule a day to execute payment. Use null to send payment right now.',
    example: null,
    required: false,
    nullable: true,
  })
  payment_date?: Date;

  @ApiPropertyOptional({
    description: 'User defined payment description.',
    required: false,
    nullable: true,
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Error returned when payment is reverted.',
    example:
      'Não foi possível processar o seu pedido. Por favor tente novamente.',
    required: false,
    nullable: true,
  })
  failed_message?: string;

  @ApiProperty({
    description: 'Payment created date.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: GetPaymentByIdResponse) {
    this.id = props.id;
    this.operation_id = props.operationId;
    this.state = props.state;
    this.value = props.value;
    this.payment_date = props.paymentDate;
    this.description = props.description;
    this.created_at = props.createdAt;
    this.failed_message = props.failed?.message;
  }
}

/**
 * User pix payments controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Payments')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@Controller('pix/payments/:id')
@HasPermission('api-users-get-pix-payments-by-id')
export class GetPaymentByIdRestController {
  /**
   * get by id payment endpoint.
   */
  @ApiOperation({
    summary: 'Get a PIX payment status.',
  })
  @ApiOkResponse({
    description: 'Payment received.',
    type: GetPaymentByIdRestResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'User authentication failed.',
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Get()
  async execute(
    @AuthUserParam() user: AuthUser,
    @AuthWalletParam() wallet: AuthWallet,
    @Param() params: GetPaymentByIdParams,
    @KafkaServiceParam(GetPaymentByIdServiceKafka)
    service: GetPaymentByIdServiceKafka,
    @LoggerParam(GetPaymentByIdRestController)
    logger: Logger,
  ): Promise<GetPaymentByIdRestResponse> {
    // Create a payload.
    const payload: GetPaymentByIdRequest = {
      id: params.id,
      userId: user.uuid,
      walletId: wallet.id,
    };

    logger.debug('Get By id payment.', { user, payload });

    // Call get payment service.
    const result = await service.execute(payload);

    logger.debug('Payment result.', { result });

    const response = result && new GetPaymentByIdRestResponse(result);

    return response;
  }
}
