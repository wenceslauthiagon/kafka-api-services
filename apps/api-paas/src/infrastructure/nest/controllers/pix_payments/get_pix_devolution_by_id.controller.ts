import { Controller, Param, Get } from '@nestjs/common';
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
import { AuthUserParam } from '@zro/users/infrastructure';
import { PixDevolutionState } from '@zro/pix-payments/domain';
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

class GetByPixDevolutionIdParams {
  @ApiProperty({
    description: 'Devolution ID.',
  })
  @IsUUID(4)
  id: string;
}

class GetByPixDevolutionIdRestResponse {
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
    description: 'Devolution created at.',
    example: new Date(),
  })
  created_at: Date;

  @ApiProperty({
    description:
      'Operation UUID. Used to get receipt and track the transaction. This will not be returned if the payment has been scheduled.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  operation_id: string;

  constructor(props: GetPixDevolutionByIdResponse) {
    this.id = props.id;
    this.amount = props.amount;
    this.description = props.description;
    this.failed_message = props.failed?.message;
    this.state = props.state;
    this.created_at = props.createdAt;
    this.operation_id = props.operationId;
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
export class GetByPixDevolutionIdRestController {
  /**
   * create devolution endpoint.
   */
  @ApiOperation({
    deprecated: true,
    summary: 'Get a PIX devolution by id.',
    description: 'Get a PIX devolution by id.',
  })
  @ApiOkResponse({
    description: 'The PIX devolution returned successfully.',
    type: GetByPixDevolutionIdRestResponse,
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
    @KafkaServiceParam(GetPixDevolutionByIdServiceKafka)
    service: GetPixDevolutionByIdServiceKafka,
    @LoggerParam(GetByPixDevolutionIdRestController)
    logger: Logger,
    @Param() params: GetByPixDevolutionIdParams,
  ): Promise<GetByPixDevolutionIdRestResponse> {
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

    const response = result && new GetByPixDevolutionIdRestResponse(result);

    return response;
  }
}
