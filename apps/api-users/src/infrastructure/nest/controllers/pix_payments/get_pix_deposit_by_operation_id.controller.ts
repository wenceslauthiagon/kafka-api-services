import { Logger } from 'winston';
import { Controller, Get, Param, Version } from '@nestjs/common';
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
  cpfMask,
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthWallet } from '@zro/operations/domain';
import { PixDepositState } from '@zro/pix-payments/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { GetPixDepositByOperationIdServiceKafka } from '@zro/pix-payments/infrastructure';
import {
  GetPixDepositByOperationIdRequest,
  GetPixDepositByOperationIdResponse,
} from '@zro/pix-payments/interface';
import {
  AuthWalletParam,
  WalletApiHeader,
} from '@zro/operations/infrastructure';

export class LegacyGetPixDepositByOperationIdRestParams {
  @ApiProperty({
    description: 'Operation id.',
  })
  @IsUUID(4)
  operation_id!: string;
}

export class GetPixDepositByOperationIdRestParams {
  @ApiProperty({
    description: 'Operation id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  id!: string;
}

export class GetPixDepositByOperationIdRestResponse {
  @ApiProperty({
    description: 'Deposit ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiProperty({
    description: 'Deposit available amount.',
    example: 1299,
  })
  available_amount: number;

  @ApiPropertyOptional({
    description: 'Deposit thirdPartName.',
    example: 'Full name.',
  })
  third_part_name: string;

  @ApiPropertyOptional({
    description: 'Deposit thirdPartDocument.',
    example: '***456789**',
  })
  third_part_document: string;

  @ApiProperty({
    enum: PixDepositState,
    description: 'Deposit state.',
    example: PixDepositState.RECEIVED,
  })
  state: PixDepositState;

  @ApiProperty({
    description: 'Deposit created at.',
    example: new Date(),
  })
  created_at: Date;

  constructor(props: GetPixDepositByOperationIdResponse) {
    this.id = props.id;
    this.available_amount = props.availableAmount;
    this.third_part_name = props.thirdPartName;
    this.third_part_document = cpfMask(props.thirdPartDocument);
    this.state = props.state;
    this.created_at = props.createdAt;
  }
}

/**
 * GetPixDepositByOperationId controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Deposits')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@Controller('pix/deposits')
@HasPermission('api-users-get-pix-deposits-by-operation-id')
export class GetPixDepositByOperationIdRestController {
  // TODO: Remove legacy function
  @ApiOperation({
    deprecated: true,
    summary: 'Get deposit by operation id.',
  })
  @ApiOkResponse({
    description: 'Deposit found by operation id successfully.',
    type: GetPixDepositByOperationIdRestResponse,
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
  @Get(':operation_id')
  async legacyExecute(
    @AuthUserParam() user: AuthUser,
    @AuthWalletParam() wallet: AuthWallet,
    @Param() legacyParams: LegacyGetPixDepositByOperationIdRestParams,
    @KafkaServiceParam(GetPixDepositByOperationIdServiceKafka)
    service: GetPixDepositByOperationIdServiceKafka,
    @LoggerParam(GetPixDepositByOperationIdRestController)
    logger: Logger,
  ): Promise<GetPixDepositByOperationIdRestResponse> {
    // Creates a payload
    const params: GetPixDepositByOperationIdRestParams = {
      id: legacyParams.operation_id,
    };

    return this.execute(user, wallet, params, service, logger);
  }

  @ApiOperation({
    summary: 'Get deposit by operation id.',
  })
  @ApiOkResponse({
    description: 'Deposit found by operation id successfully.',
    type: GetPixDepositByOperationIdRestResponse,
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
  @Get('by-operation/:id')
  @Version('2')
  async execute(
    @AuthUserParam() user: AuthUser,
    @AuthWalletParam() wallet: AuthWallet,
    @Param() params: GetPixDepositByOperationIdRestParams,
    @KafkaServiceParam(GetPixDepositByOperationIdServiceKafka)
    service: GetPixDepositByOperationIdServiceKafka,
    @LoggerParam(GetPixDepositByOperationIdRestController)
    logger: Logger,
  ): Promise<GetPixDepositByOperationIdRestResponse> {
    // Creates a payload
    const payload: GetPixDepositByOperationIdRequest = {
      userId: user.uuid,
      walletId: wallet.id,
      operationId: params.id,
    };

    logger.debug('Getting deposit by operation id.', { user, payload });

    // Calls getPixDepositByOperationId service.
    const result = await service.execute(payload);

    logger.debug('Deposit result.', { result });

    const response =
      result && new GetPixDepositByOperationIdRestResponse(result);

    return response;
  }
}
