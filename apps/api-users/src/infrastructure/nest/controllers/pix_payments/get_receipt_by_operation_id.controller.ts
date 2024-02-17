import { Logger } from 'winston';
import { Controller, Get, Param, Version } from '@nestjs/common';
import { IsBoolean, IsObject, IsString, IsUUID } from 'class-validator';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthWallet } from '@zro/operations/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { GetReceiptByOperationIdServiceKafka } from '@zro/pix-payments/infrastructure';
import {
  GetReceiptByOperationIdRequest,
  GetReceiptByOperationIdResponse,
  PaymentData,
} from '@zro/pix-payments/interface';
import {
  AuthWalletParam,
  WalletApiHeader,
} from '@zro/operations/infrastructure';

class LegacyGetReceiptByOperationIdRestParams {
  @ApiProperty({
    description: 'Operation id.',
  })
  @IsUUID(4)
  operation_id!: string;
}

class GetReceiptByOperationIdRestParams {
  @ApiProperty({
    description: 'Operation id.',
  })
  @IsUUID(4)
  id!: string;
}

class GetReceiptByOperationIdRestResponse {
  @IsObject()
  @ApiProperty({
    description: 'Payment data (Id, value, date, etc).',
  })
  payment_data!: PaymentData;

  @IsString()
  @ApiProperty({
    description: 'Payment title.',
    example: 'Pix key scheduled successfully.',
  })
  payment_title!: string;

  @IsUUID(4)
  @ApiProperty({
    description: 'Related operation id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  operation_id!: string;

  @IsBoolean()
  @ApiProperty({
    description: 'If payment state is scheduled.',
    example: true,
  })
  is_scheduled!: boolean;

  @IsBoolean()
  @ApiProperty({
    description: 'If payment state can be returned.',
    example: false,
  })
  active_devolution!: boolean;

  constructor(props: GetReceiptByOperationIdResponse) {
    this.payment_data = props.paymentData;
    this.payment_title = props.paymentTitle;
    this.operation_id = props.operationId;
    this.is_scheduled = props.isScheduled;
    this.active_devolution = props.activeDevolution;
  }
}

/**
 * GetReceiptByOperationId controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Payments')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@Controller('pix')
@HasPermission('api-users-get-pix-payments-receipt-by-operation-id')
export class GetReceiptByOperationIdRestController {
  // TODO: Remove legacy function
  @ApiOperation({
    deprecated: true,
    summary: 'Get receipt by its operation id.',
    description:
      "Enter the pix payment's operation ID below and execute to get its receipt. Should use <b>/operations/{id}/receipt</b> path.",
  })
  @ApiOkResponse({
    description: 'Receipt found by operation id successfully.',
    type: GetReceiptByOperationIdRestResponse,
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
  @Get('payments/receipt/:operation_id')
  async legacyExecute(
    @AuthUserParam() user: AuthUser,
    @AuthWalletParam() wallet: AuthWallet,
    @Param() legacyParams: LegacyGetReceiptByOperationIdRestParams,
    @KafkaServiceParam(GetReceiptByOperationIdServiceKafka)
    getService: GetReceiptByOperationIdServiceKafka,
    @LoggerParam(GetReceiptByOperationIdRestController)
    logger: Logger,
  ): Promise<GetReceiptByOperationIdRestResponse> {
    // Creates a payload
    const params: GetReceiptByOperationIdRestParams = {
      id: legacyParams.operation_id,
    };

    return this.execute(user, wallet, params, getService, logger);
  }

  // TODO: Remove legacy function
  @ApiOperation({
    deprecated: true,
    summary: 'Get receipt by its operation id.',
    description:
      "Enter the pix payment's operation ID below and execute to get its receipt. Should use <b>/operations/{id}/receipt</b> path.",
  })
  @ApiOkResponse({
    description: 'Receipt found by operation id successfully.',
    type: GetReceiptByOperationIdRestResponse,
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
  @Get('receipt/by-operation/:id')
  @Version('2')
  async execute(
    @AuthUserParam() user: AuthUser,
    @AuthWalletParam() wallet: AuthWallet,
    @Param() params: GetReceiptByOperationIdRestParams,
    @KafkaServiceParam(GetReceiptByOperationIdServiceKafka)
    service: GetReceiptByOperationIdServiceKafka,
    @LoggerParam(GetReceiptByOperationIdRestController)
    logger: Logger,
  ): Promise<GetReceiptByOperationIdRestResponse> {
    // Creates a payload
    const payload: GetReceiptByOperationIdRequest = {
      userId: user.uuid,
      walletId: wallet.id,
      operationId: params.id,
    };

    logger.debug('Getting receipt by operation id.', { user, payload });

    // Calls getReceiptByOperationId service.
    const result = await service.execute(payload);

    logger.debug('Receipt result.', { result });

    const response = result && new GetReceiptByOperationIdRestResponse(result);

    return response;
  }
}
