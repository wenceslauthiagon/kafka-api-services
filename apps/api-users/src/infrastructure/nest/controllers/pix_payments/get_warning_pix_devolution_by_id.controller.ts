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
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { WarningPixDevolutionState } from '@zro/pix-payments/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { GetWarningPixDevolutionByIdServiceKafka } from '@zro/pix-payments/infrastructure';
import {
  GetWarningPixDevolutionByIdRequest,
  GetWarningPixDevolutionByIdResponse,
} from '@zro/pix-payments/interface';
import { WalletApiHeader } from '@zro/operations/infrastructure';

class GetByPixDevolutionIdParams {
  @ApiProperty({
    description: 'Devolution ID.',
  })
  @IsUUID(4)
  id!: string;
}

class GetWarningPixDevolutionByIdRestResponse {
  @ApiProperty({
    description: 'Devolution ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiProperty({
    description:
      'Operation UUID. Used to get receipt and track the transaction. This will not be returned if the payment has been scheduled.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  operation_id: string;

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

  @ApiProperty({
    enum: WarningPixDevolutionState,
    description: 'Devolution state.',
    example: WarningPixDevolutionState.CONFIRMED,
  })
  state: WarningPixDevolutionState;

  @ApiProperty({
    description: 'Devolution created at.',
    example: new Date(),
  })
  created_at: Date;

  constructor(props: GetWarningPixDevolutionByIdResponse) {
    this.id = props.id;
    this.state = props.state;
    this.description = props.description;
    this.operation_id = props.operationId;
    this.amount = props.amount;
    this.created_at = props.createdAt;
  }
}

/**
 * User warning pix devolutions controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Devolutions')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@Controller('pix/warning-pix-devolution/:id')
@HasPermission('api-users-get-pix-warning-devolutions-by-id')
export class GetByWarningPixDevolutionIdRestController {
  /**
   * create warning devolution endpoint.
   */
  @ApiOperation({
    summary: 'Get warning pix devolution by ID.',
    description:
      "Enter the warning pix devolution's ID below and execute to get its state and all information.",
  })
  @ApiOkResponse({
    description: 'The PIX warning devolution returned successfully.',
    type: GetWarningPixDevolutionByIdResponse,
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
    @KafkaServiceParam(GetWarningPixDevolutionByIdServiceKafka)
    service: GetWarningPixDevolutionByIdServiceKafka,
    @LoggerParam(GetByWarningPixDevolutionIdRestController)
    logger: Logger,
    @Param() params: GetByPixDevolutionIdParams,
  ): Promise<GetWarningPixDevolutionByIdRestResponse> {
    // GetById a payload.
    const payload: GetWarningPixDevolutionByIdRequest = {
      id: params.id,
      userId: user.uuid,
    };

    logger.debug('GetById warning devolution.', { user, payload });

    // Call create warning devolution service.
    const result = await service.execute(payload);

    logger.debug('Warning devolution created.', { result });

    const response =
      result && new GetWarningPixDevolutionByIdRestResponse(result);

    return response;
  }
}
