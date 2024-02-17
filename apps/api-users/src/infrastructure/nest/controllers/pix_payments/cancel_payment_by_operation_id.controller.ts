import {
  Controller,
  Param,
  HttpCode,
  HttpStatus,
  Delete,
  Version,
} from '@nestjs/common';
import { IsUUID } from 'class-validator';
import { Logger } from 'winston';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiProperty,
} from '@nestjs/swagger';
import {
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthWallet } from '@zro/operations/domain';
import { AccountType, PaymentState } from '@zro/pix-payments/domain';
import {
  CancelPaymentByOperationIdRequest,
  CancelPaymentByOperationIdResponse,
} from '@zro/pix-payments/interface';
import { CancelPaymentServiceKafka } from '@zro/pix-payments/infrastructure';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  AuthWalletParam,
  WalletApiHeader,
} from '@zro/operations/infrastructure';

class LegacyCancelPaymentRestParams {
  @ApiProperty({
    description: 'Payment operation ID.',
  })
  @IsUUID(4)
  operation_id!: string;
}

class CancelPaymentRestParams {
  @ApiProperty({
    description: 'Payment operation ID.',
  })
  @IsUUID(4)
  id!: string;
}

class CancelPaymentRestResponse {
  @ApiProperty({
    description: 'Payment ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    enum: AccountType,
    description: 'Payment account type.',
    example: AccountType.CACC,
  })
  type!: AccountType;

  @ApiProperty({
    enum: PaymentState,
    description: 'Payment state.',
    example: PaymentState.SCHEDULED,
  })
  state!: PaymentState;

  @ApiProperty({
    description: 'Payment created at.',
    example: new Date(),
  })
  created_at!: Date;

  @ApiProperty({
    description: 'Payment deleted at.',
    example: new Date(),
  })
  canceled_at!: Date;

  @ApiProperty({
    description: 'Payment date.',
    example: new Date(),
  })
  payment_date!: Date;

  constructor(props: CancelPaymentByOperationIdResponse) {
    this.id = props.id;
    this.type = props.type;
    this.state = props.state;
    this.created_at = props.createdAt;
    this.canceled_at = props.canceledAt;
    this.payment_date = props.paymentDate;
  }
}

/**
 * Cancel pix payment rest controller.
 */
@ApiTags('Pix | Payments')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@Controller('pix/payments')
@HasPermission('api-users-delete-pix-payments-by-operation-id')
export class CancelPaymentByOperationIdRestController {
  // TODO: Remove legacy function
  @ApiOperation({
    deprecated: true,
    summary: 'Cancel payment by operation id.',
    description: `Cancel payment by id process. This route works for ${PaymentState.SCHEDULED}. If payment state is:<br>
    <ul>
      <li>${PaymentState.SCHEDULED}: payment state will change to ${PaymentState.CANCELED}.
    </ul>
    Return payment which state is ${PaymentState.CANCELED}.`,
  })
  @ApiOkResponse({
    description: 'Payment canceled.',
    type: CancelPaymentRestResponse,
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
  @ApiNotFoundResponse({
    description: 'If the payment id was not found.',
  })
  @Delete('/:operation_id')
  @HttpCode(HttpStatus.OK)
  async legacyExecute(
    @AuthUserParam() user: AuthUser,
    @AuthWalletParam() wallet: AuthWallet,
    @Param() legacyParams: LegacyCancelPaymentRestParams,
    @KafkaServiceParam(CancelPaymentServiceKafka)
    cancelPaymentService: CancelPaymentServiceKafka,
    @LoggerParam(CancelPaymentByOperationIdRestController)
    logger: Logger,
  ): Promise<CancelPaymentRestResponse> {
    // Create a payload.
    const params: CancelPaymentRestParams = {
      id: legacyParams.operation_id,
    };

    return this.execute(user, wallet, params, cancelPaymentService, logger);
  }

  @ApiOperation({
    summary: 'Cancel payment by operation id.',
    description: `Cancel payment by id process. This route works for ${PaymentState.SCHEDULED}. If payment state is:<br>
    <ul>
      <li>${PaymentState.SCHEDULED}: payment state will change to ${PaymentState.CANCELED}.
    </ul>
    Return payment which state is ${PaymentState.CANCELED}.`,
  })
  @ApiOkResponse({
    description: 'Payment canceled.',
    type: CancelPaymentRestResponse,
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
  @ApiNotFoundResponse({
    description: 'If the payment id was not found.',
  })
  @Version('2')
  @Delete('by-operation/:id')
  @HttpCode(HttpStatus.OK)
  async execute(
    @AuthUserParam() user: AuthUser,
    @AuthWalletParam() wallet: AuthWallet,
    @Param() params: CancelPaymentRestParams,
    @KafkaServiceParam(CancelPaymentServiceKafka)
    service: CancelPaymentServiceKafka,
    @LoggerParam(CancelPaymentByOperationIdRestController)
    logger: Logger,
  ): Promise<CancelPaymentRestResponse> {
    // Create a payload.
    const payload: CancelPaymentByOperationIdRequest = {
      userId: user.uuid,
      walletId: wallet.id,
      operationId: params.id,
    };

    logger.debug('Start cancel pix payment.', { user, payload });

    // Call cancel pix payment service.
    const result = await service.execute(payload);

    logger.debug('Payment updated.', { result });

    const response = new CancelPaymentRestResponse(result);

    return response;
  }
}
