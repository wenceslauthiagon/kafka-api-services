import { Controller, Param, Get, Version } from '@nestjs/common';
import { IsUUID } from 'class-validator';
import { Logger } from 'winston';
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
import { PixDevolutionState } from '@zro/pix-payments/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { GetPixDevolutionByIdServiceKafka } from '@zro/pix-payments/infrastructure';
import {
  GetPixDevolutionByIdRequest,
  GetPixDevolutionByIdResponse,
} from '@zro/pix-payments/interface';
import { AuthWallet } from '@zro/operations/domain';
import {
  WalletApiHeader,
  AuthWalletParam,
} from '@zro/operations/infrastructure';

export class V3GetByPixDevolutionIdParams {
  @ApiProperty({
    description: 'Devolution ID.',
  })
  @IsUUID(4)
  id: string;
}

export class V3GetByPixDevolutionIdRestResponse {
  @ApiProperty({
    description: 'Devolution ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiProperty({
    description: 'Value in R$ cents.',
    example: 1299,
  })
  amount: number;

  @ApiPropertyOptional({
    description: 'User defined devolution description.',
    example: 'The party devolution.',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Error returned when devolution is reverted.',
    example:
      'Não foi possível processar o seu pedido. Por favor tente novamente.',
    required: false,
    nullable: true,
  })
  failed_message?: string;

  @ApiProperty({
    enum: PixDevolutionState,
    description: 'Devolution state.',
    example: PixDevolutionState.CONFIRMED,
  })
  state: PixDevolutionState;

  @ApiProperty({
    description:
      'Operation UUID. Used to get receipt and track the transaction. This will not be returned if the payment has been scheduled.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  operation_id: string;

  @ApiProperty({
    description: 'Devolution created at.',
    example: new Date(),
  })
  created_at: Date;

  constructor(props: GetPixDevolutionByIdResponse) {
    this.id = props.id;
    this.state = props.state;
    this.description = props.description;
    this.operation_id = props.operationId;
    this.failed_message = props.failed?.message;
    this.amount = props.amount;
    this.created_at = props.createdAt;
  }
}

/**
 * User pix devolutions controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Devolutions')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@Controller('pix/devolutions/:id')
@HasPermission('api-paas-get-pix-devolutions-by-id')
export class V3GetByPixDevolutionIdRestController {
  /**
   * create devolution endpoint.
   */
  @ApiOperation({
    summary: 'Get pix devolution by ID.',
    description:
      "Enter the pix devolution's ID below and execute to get its state and all information.",
  })
  @ApiOkResponse({
    description: 'The PIX devolution returned successfully.',
    type: V3GetByPixDevolutionIdRestResponse,
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
  @Version('3')
  @Get()
  async execute(
    @AuthUserParam() user: AuthUser,
    @AuthWalletParam() wallet: AuthWallet,
    @KafkaServiceParam(GetPixDevolutionByIdServiceKafka)
    service: GetPixDevolutionByIdServiceKafka,
    @LoggerParam(V3GetByPixDevolutionIdRestController)
    logger: Logger,
    @Param() params: V3GetByPixDevolutionIdParams,
  ): Promise<V3GetByPixDevolutionIdRestResponse> {
    // GetById a payload.
    const payload: GetPixDevolutionByIdRequest = {
      id: params.id,
      userId: user.uuid,
      walletId: wallet.id,
    };

    logger.debug('GetById devolution.', { user, payload });

    // Call create devolution service.
    const result = await service.execute(payload);

    logger.debug('Devolution created.', { result });

    const response = new V3GetByPixDevolutionIdRestResponse(result);

    return response;
  }
}
