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
  IsUUID,
  IsPositive,
  IsInt,
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
import { AuthUser } from '@zro/users/domain';
import { PaymentState } from '@zro/pix-payments/domain';
import { AuthWallet } from '@zro/operations/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  ChangeByQrCodeDynamicPaymentRequest,
  ChangeByQrCodeDynamicPaymentResponse,
} from '@zro/pix-payments/interface';
import { ChangeByQrCodeDynamicPaymentServiceKafka } from '@zro/pix-payments/infrastructure';
import { PinGuard, PinBody } from '@zro/api-users/infrastructure';
import {
  AuthWalletParam,
  WalletApiHeader,
} from '@zro/operations/infrastructure';

class PaymentByChangeQrCodeDynamicBody extends PinBody {
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

class ChangeByQrCodeDynamicPaymentRestResponse {
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

  @ApiPropertyOptional({
    description:
      'Change Operation UUID. This will not be returned if the payment was scheduled.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
    required: false,
  })
  change_operation_id?: string;

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

  constructor(props: ChangeByQrCodeDynamicPaymentResponse) {
    this.id = props.id;
    this.operation_id = props.operationId;
    this.change_operation_id = props.changeOperationId;
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
@Controller('pix/payments/by-qr-code/dynamic/change')
@HasPermission('api-users-post-pix-payments-by-qr-code-dynamic-change')
export class ChangeByQrCodeDynamicPaymentRestController {
  /**
   * send payment endpoint.
   */
  @ApiOperation({
    summary: 'Change a payment with qr code dynamic.',
  })
  @ApiCreatedResponse({
    description: 'Payment accomplished.',
    type: ChangeByQrCodeDynamicPaymentRestResponse,
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
    @Body() body: PaymentByChangeQrCodeDynamicBody,
    @KafkaServiceParam(ChangeByQrCodeDynamicPaymentServiceKafka)
    service: ChangeByQrCodeDynamicPaymentServiceKafka,
    @LoggerParam(ChangeByQrCodeDynamicPaymentRestController)
    logger: Logger,
    @RequestTransactionId() transactionId: string,
  ): Promise<ChangeByQrCodeDynamicPaymentRestResponse> {
    // Send a payload.
    const payload: ChangeByQrCodeDynamicPaymentRequest = {
      id: transactionId,
      userId: user.uuid,
      walletId: wallet.id,
      decodedQrCodeId: body.decoded_qr_code_id,
      value: body.value,
      description: body.description,
    };

    logger.debug('Change payment.', { user, payload });

    // Call send payment service.
    const result = await service.execute(payload);

    logger.debug('payment sent.', result);

    const response = new ChangeByQrCodeDynamicPaymentRestResponse(result);

    return response;
  }
}
