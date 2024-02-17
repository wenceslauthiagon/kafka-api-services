import { Logger } from 'winston';
import { IsUUID } from 'class-validator';
import { Controller, Get, Param } from '@nestjs/common';
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
  DefaultApiHeaders,
  HasPermission,
  KafkaServiceParam,
  LoggerParam,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthWallet, OperationState } from '@zro/operations/domain';
import {
  GetOperationByUserAndWalletAndIdResponse,
  GetOperationByUserAndWalletAndIdRequest,
} from '@zro/operations/interface';
import {
  AuthWalletParam,
  GetOperationByUserAndWalletAndIdServiceKafka,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import { AuthUserParam } from '@zro/users/infrastructure';

class GetOperationByIdParams {
  @ApiProperty({
    description: 'Operation Uuid.',
  })
  @IsUUID(4)
  id!: string;
}

class GetOperationByIdRestResponse {
  @ApiProperty({
    description: 'Operation id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'Operation fee in cents.',
    example: 0,
  })
  fee?: number;

  @ApiProperty({
    description: 'Operation state.',
    enum: OperationState,
    example: OperationState.ACCEPTED,
  })
  state: OperationState;

  @ApiProperty({
    description: 'Operation description.',
  })
  description: string;

  @ApiPropertyOptional({
    description: 'Operation value in cents.',
    example: 1880000,
  })
  value: number;

  @ApiProperty({
    description: 'Operation created at.',
    example: new Date(),
  })
  created_at: Date;

  @ApiPropertyOptional({
    description: 'Operation reverted at.',
    example: new Date(),
  })
  reverted_at?: Date;

  @ApiProperty({
    description: 'Currency Id.',
    example: 2,
  })
  currency_id: number;

  @ApiProperty({
    description: 'Currency symbol.',
    example: 'R$',
  })
  currency_symbol: string;

  @ApiProperty({
    description: 'Transaction id.',
    example: 2,
  })
  transaction_id: number;

  @ApiProperty({
    description: 'Transaction tag.',
    example: 'BRL',
  })
  transaction_tag: string;

  @ApiPropertyOptional({
    description: 'Operation owner wallet.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  owner_wallet_uuid?: string;

  @ApiPropertyOptional({
    description: 'Operation beneficiary wallet uuid.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  beneficiary_wallet_uuid?: string;

  @ApiPropertyOptional({
    description: 'Operation ref id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  operation_ref_id?: string;

  @ApiPropertyOptional({
    description: 'Operation chargeback id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  chargeback_id?: string;

  constructor(props: GetOperationByUserAndWalletAndIdResponse) {
    this.id = props.id;
    this.fee = props.fee;
    this.state = props.state;
    this.description = props.description;
    this.value = props.value;
    this.created_at = props.createdAt;
    this.reverted_at = props.revertedAt;
    this.currency_id = props.currencyId;
    this.currency_symbol = props.currencySymbol;
    this.transaction_id = props.transactionId;
    this.transaction_tag = props.transactionTag;
    this.owner_wallet_uuid = props.ownerWalletUuid;
    this.beneficiary_wallet_uuid = props.beneficiaryWalletUuid;
    this.operation_ref_id = props.operationRefId;
    this.chargeback_id = props.chargebackId;
  }
}

/**
 * Operations controller. Controller is protected by JWT access token.
 */
@ApiTags('Operations | Operation')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@Controller('operations/:id')
@HasPermission('api-paas-get-operations-by-id')
export class GetOperationByIdRestController {
  /**
   * get operations endpoint.
   */
  @ApiOperation({
    summary: "Get user's operation.",
    description: "Get user's operation.",
  })
  @ApiOkResponse({
    description: 'The operation returned successfully.',
    type: GetOperationByIdRestResponse,
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
    @Param() params: GetOperationByIdParams,
    @KafkaServiceParam(GetOperationByUserAndWalletAndIdServiceKafka)
    getOperationByIdService: GetOperationByUserAndWalletAndIdServiceKafka,
    @LoggerParam(GetOperationByIdRestController)
    logger: Logger,
  ): Promise<GetOperationByIdRestResponse> {
    // GetAll payload.
    const payload: GetOperationByUserAndWalletAndIdRequest = {
      userId: user.uuid,
      walletId: wallet.id,
      id: params.id,
    };

    logger.debug('Get operation.', { user, payload });

    // Call get operation service.
    const result = await getOperationByIdService.execute(payload);

    logger.debug('Operation found.', { result });

    const response = new GetOperationByIdRestResponse(result);

    return response;
  }
}
