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
import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';
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
  DuedateByQrCodeDynamicPaymentRequest,
  DuedateByQrCodeDynamicPaymentResponse,
} from '@zro/pix-payments/interface';
import { DuedateByQrCodeDynamicPaymentServiceKafka } from '@zro/pix-payments/infrastructure';
import { PinGuard, PinBody } from '@zro/api-users/infrastructure';

class PaymentByDuedateQrCodeDynamicBody extends PinBody {
  @ApiProperty({
    description: 'Decoded qr code ID.',
    example: 'abb8e578-6540-4104-8fa9-90a854ab0d1c',
  })
  @IsUUID(4)
  decoded_qr_code_id!: string;

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

class DuedateByQrCodeDynamicPaymentRestResponse {
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
      'Duedate a day to execute payment. Use null to send payment right now.',
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

  constructor(props: DuedateByQrCodeDynamicPaymentResponse) {
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
@Controller('pix/payments/by-qr-code/dynamic/due-date-billing')
@HasPermission(
  'api-users-post-pix-payments-by-qr-code-dynamic-due-date-billing',
)
export class DuedateByQrCodeDynamicPaymentRestController {
  /**
   * send payment endpoint.
   */
  @ApiOperation({
    summary: 'Duedate a payment with qr code dynamic.',
  })
  @ApiCreatedResponse({
    description: 'Payment accomplished.',
    type: DuedateByQrCodeDynamicPaymentRestResponse,
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
    @Body() body: PaymentByDuedateQrCodeDynamicBody,
    @KafkaServiceParam(DuedateByQrCodeDynamicPaymentServiceKafka)
    service: DuedateByQrCodeDynamicPaymentServiceKafka,
    @LoggerParam(DuedateByQrCodeDynamicPaymentRestController)
    logger: Logger,
    @RequestTransactionId() transactionId: string,
  ): Promise<DuedateByQrCodeDynamicPaymentRestResponse> {
    // Send a payload.
    const payload: DuedateByQrCodeDynamicPaymentRequest = {
      id: transactionId,
      userId: user.uuid,
      walletId: wallet.id,
      decodedQrCodeId: body.decoded_qr_code_id,
      description: body.description,
    };

    logger.debug('Send payment.', { user, payload });

    // Call send payment service.
    const result = await service.execute(payload);

    logger.debug('Payment sent.', { result });

    const response = new DuedateByQrCodeDynamicPaymentRestResponse(result);

    return response;
  }
}
