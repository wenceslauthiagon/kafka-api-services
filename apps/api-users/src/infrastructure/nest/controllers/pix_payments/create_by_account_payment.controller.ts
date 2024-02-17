import { Controller, Body, Post, UseGuards } from '@nestjs/common';
import { Logger } from 'winston';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsPositive,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  EnableReplayProtection,
  IsIsoStringDateFormat,
  KafkaServiceParam,
  LoggerParam,
  SanitizeHtml,
  DefaultApiHeaders,
  HasPermission,
  RequestTransactionId,
  TransactionApiHeader,
  MaxValue,
  getMoment,
} from '@zro/common';
import { PaymentState } from '@zro/pix-payments/domain';
import { AuthUser } from '@zro/users/domain';
import { AuthWallet } from '@zro/operations/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  AuthWalletParam,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import {
  CreateByAccountPaymentRequest,
  CreateByAccountPaymentResponse,
} from '@zro/pix-payments/interface';
import { CreateByAccountPaymentServiceKafka } from '@zro/pix-payments/infrastructure';
import { PinGuard, PinBody } from '@zro/api-users/infrastructure';

class PaymentByAccountBody extends PinBody {
  @ApiProperty({
    description: 'Decoded pix account ID.',
    example: 'abb8e578-6540-4104-8fa9-90a854ab0d1c',
  })
  @IsUUID(4)
  decoded_pix_account_id!: string;

  @ApiProperty({
    description: 'Value in R$ cents.',
    example: 1299,
  })
  @IsInt()
  @IsPositive()
  @MaxValue(1e18)
  value!: number;

  @ApiPropertyOptional({
    description: 'Payment date.',
    format: 'YYYY-MM-DD',
    example: getMoment().format('YYYY-MM-DD'),
    required: false,
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD')
  payment_date?: Date;

  @ApiPropertyOptional({
    description: 'User defined payment description.',
    example: 'User defined description',
    required: false,
  })
  @IsOptional()
  @IsString()
  @SanitizeHtml()
  @MaxLength(140)
  description?: string;
}

class CreateByAccountPaymentRestResponse {
  @ApiProperty({
    description: 'Payment UUID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiPropertyOptional({
    description:
      'Operation UUID. This will not be returned if the payment was scheduled.',
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

  @ApiProperty({
    description: 'Payment created date.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: CreateByAccountPaymentResponse) {
    this.id = props.id;
    this.operation_id = props.operationId;
    this.state = props.state;
    this.value = props.value;
    this.payment_date = props.paymentDate;
    this.description = props.description;
    this.created_at = props.createdAt;
  }
}

/**
 * User pix payments controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Payments')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@UseGuards(PinGuard)
@TransactionApiHeader()
@EnableReplayProtection()
@Controller('pix/payments/by-account/instant-billing')
@HasPermission('api-users-post-pix-payments-by-account-instant-billing')
export class CreateByAccountPaymentRestController {
  /**
   * send payment endpoint.
   */
  @ApiOperation({
    summary: 'Create a payment with account.',
  })
  @ApiCreatedResponse({
    description: 'Payment accomplished.',
    type: CreateByAccountPaymentRestResponse,
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
  @Post()
  async execute(
    @AuthUserParam() user: AuthUser,
    @AuthWalletParam() wallet: AuthWallet,
    @Body() body: PaymentByAccountBody,
    @KafkaServiceParam(CreateByAccountPaymentServiceKafka)
    service: CreateByAccountPaymentServiceKafka,
    @LoggerParam(CreateByAccountPaymentRestController)
    logger: Logger,
    @RequestTransactionId() transactionId: string,
  ): Promise<CreateByAccountPaymentRestResponse> {
    // Send a payload.
    const payload: CreateByAccountPaymentRequest = {
      id: transactionId,
      userId: user.uuid,
      walletId: wallet.id,
      decodedPixAccountId: body.decoded_pix_account_id,
      paymentDate: body.payment_date,
      value: body.value,
      description: body.description,
    };

    logger.debug('Send payment.', { user, payload });

    // Call send payment service.
    const result = await service.execute(payload);

    logger.debug('Payment sent.', result);

    const response = new CreateByAccountPaymentRestResponse(result);

    return response;
  }
}
