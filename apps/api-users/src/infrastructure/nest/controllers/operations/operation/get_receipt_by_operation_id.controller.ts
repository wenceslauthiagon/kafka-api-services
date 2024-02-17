import { Logger } from 'winston';
import { Controller, Get, Param } from '@nestjs/common';
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
import { PaymentData } from '@zro/pix-payments/interface';
import {
  AuthWalletParam,
  GetOperationReceiptByUserAndWalletAndIdServiceKafka,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import {
  GetOperationReceiptByUserAndWalletAndIdRequest,
  GetOperationReceiptByUserAndWalletAndIdResponse,
} from '@zro/operations/interface';

class GetOperationReceiptByIdRestParams {
  @ApiProperty({
    description: 'Operation id.',
  })
  @IsUUID(4)
  id!: string;
}

class GetOperationReceiptByIdRestResponse {
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

  constructor(props: GetOperationReceiptByUserAndWalletAndIdResponse) {
    this.payment_data = props.paymentData;
    this.payment_title = props.paymentTitle;
    this.operation_id = props.operationId;
    this.is_scheduled = props.isScheduled;
    this.active_devolution = props.activeDevolution;
  }
}

/**
 * Operations controller. Controller is protected by JWT access token.
 */
@ApiTags('Operations | Operation')
@Controller('operations/:id/receipt')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@HasPermission('api-users-get-operations-receipt-by-id')
export class GetOperationReceiptByIdRestController {
  @ApiOperation({
    summary: 'Get receipt by its operation id.',
  })
  @ApiOkResponse({
    description: 'Receipt found by operation id successfully.',
    type: GetOperationReceiptByIdRestResponse,
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
    @Param() params: GetOperationReceiptByIdRestParams,
    @KafkaServiceParam(GetOperationReceiptByUserAndWalletAndIdServiceKafka)
    service: GetOperationReceiptByUserAndWalletAndIdServiceKafka,
    @LoggerParam(GetOperationReceiptByIdRestController)
    logger: Logger,
  ): Promise<GetOperationReceiptByIdRestResponse> {
    // Creates a payload
    const payload: GetOperationReceiptByUserAndWalletAndIdRequest = {
      userId: user.uuid,
      walletId: wallet.id,
      id: params.id,
    };

    logger.debug('Getting receipt by operation id.', { user, payload });

    // Calls GetOperationReceiptById service.
    const result = await service.execute(payload);

    logger.debug('Operation receipt result.', { result });

    const response = result && new GetOperationReceiptByIdRestResponse(result);

    return response;
  }
}
