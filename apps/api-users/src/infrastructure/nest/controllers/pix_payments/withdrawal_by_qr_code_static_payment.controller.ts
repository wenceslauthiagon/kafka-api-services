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
  KafkaServiceParam,
  LoggerParam,
  SanitizeHtml,
  DefaultApiHeaders,
  HasPermission,
  RequestTransactionId,
  TransactionApiHeader,
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
  WithdrawalByQrCodeStaticPaymentRequest,
  WithdrawalByQrCodeStaticPaymentResponse,
} from '@zro/pix-payments/interface';
import { WithdrawalByQrCodeStaticPaymentServiceKafka } from '@zro/pix-payments/infrastructure';
import { PinGuard, PinBody } from '@zro/api-users/infrastructure';

class PaymentByWithdrawalQrCodeStaticBody extends PinBody {
  @ApiProperty({
    description: 'Decoded qr code ID.',
    example: 'abb8e578-6540-4104-8fa9-90a854ab0d1c',
  })
  @IsUUID(4)
  decoded_qr_code_id!: string;

  @ApiProperty({
    description: 'Value in R$ cents.',
    example: 1299,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  value?: number;

  @ApiProperty({
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

class WithdrawalByQrCodeStaticPaymentRestResponse {
  @ApiProperty({
    description: 'Payment UUID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
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

  @ApiProperty({
    description:
      'Schedule a day to execute payment. Use null to send payment right now.',
    example: null,
    required: false,
    nullable: true,
  })
  payment_date?: Date;

  @ApiProperty({
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

  constructor(props: WithdrawalByQrCodeStaticPaymentResponse) {
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
@Controller('pix/payments/by-qr-code/static/withdrawal')
@HasPermission('api-users-post-pix-payments-by-qr-code-static-withdrawal')
export class WithdrawalByQrCodeStaticPaymentRestController {
  /**
   * send payment endpoint.
   */
  @ApiOperation({
    summary: 'Withdrawal a payment with qr code static.',
  })
  @ApiCreatedResponse({
    description: 'Payment accomplished.',
    type: WithdrawalByQrCodeStaticPaymentRestResponse,
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
    @Body() body: PaymentByWithdrawalQrCodeStaticBody,
    @KafkaServiceParam(WithdrawalByQrCodeStaticPaymentServiceKafka)
    service: WithdrawalByQrCodeStaticPaymentServiceKafka,
    @LoggerParam(WithdrawalByQrCodeStaticPaymentRestController)
    logger: Logger,
    @RequestTransactionId() transactionId: string,
  ): Promise<WithdrawalByQrCodeStaticPaymentRestResponse> {
    // Send a payload.
    const payload: WithdrawalByQrCodeStaticPaymentRequest = {
      id: transactionId,
      userId: user.uuid,
      walletId: wallet.id,
      decodedQrCodeId: body.decoded_qr_code_id,
      value: body.value,
      description: body.description,
    };

    logger.debug('Withdrawal payment.', { user, payload });

    // Call send payment service.
    const result = await service.execute(payload);

    logger.debug('Payment sent.', { result });

    const response = new WithdrawalByQrCodeStaticPaymentRestResponse(result);

    return response;
  }
}
