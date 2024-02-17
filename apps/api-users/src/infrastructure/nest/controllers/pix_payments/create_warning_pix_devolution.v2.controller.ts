import { Logger } from 'winston';
import { IsUUID } from 'class-validator';
import { Controller, Body, Post, Version, UseGuards } from '@nestjs/common';
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
import {
  EnableReplayProtection,
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { WarningPixDevolutionState } from '@zro/pix-payments/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  CreateWarningPixDevolutionRequest,
  CreateWarningPixDevolutionResponse,
} from '@zro/pix-payments/interface';
import { CreateWarningPixDevolutionServiceKafka } from '@zro/pix-payments/infrastructure';
import { PinGuard, PinBody } from '@zro/api-users/infrastructure';

class V2CreateWarningPixDevolutionBody extends PinBody {
  @ApiProperty({
    description: 'Warning Pix Deposit Operation ID.',
  })
  @IsUUID(4)
  operation_id: string;
}

class V2CreateWarningPixDevolutionRestResponse {
  @ApiProperty({
    description: 'Warning Pix Devolution ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiProperty({
    enum: WarningPixDevolutionState,
    description: 'Devolution state.',
    example: WarningPixDevolutionState.PENDING,
  })
  state: WarningPixDevolutionState;

  constructor(props: CreateWarningPixDevolutionResponse) {
    this.id = props.id;
    this.state = props.state;
  }
}

/**
 * User pix devolutions controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Devolutions')
@ApiBearerAuth()
@DefaultApiHeaders()
@UseGuards(PinGuard)
@EnableReplayProtection()
@Controller('pix/warning-pix-devolution')
@HasPermission('api-users-post-pix-warning-pix-devolution')
export class V2CreateWarningPixDevolutionRestController {
  /**
   * create devolution endpoint.
   */
  @ApiOperation({
    summary: 'Create new warning pix devolution.',
    description:
      'Enter the warning pix deposit operation on the requisition body below and execute to create a new warning pix devolution.',
  })
  @ApiCreatedResponse({
    description: 'The warning devolution returned successfully.',
    type: V2CreateWarningPixDevolutionRestResponse,
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
  @Version('2')
  @Post()
  async execute(
    @AuthUserParam() user: AuthUser,
    @KafkaServiceParam(CreateWarningPixDevolutionServiceKafka)
    createService: CreateWarningPixDevolutionServiceKafka,
    @LoggerParam(V2CreateWarningPixDevolutionRestController)
    logger: Logger,
    @Body() body: V2CreateWarningPixDevolutionBody,
  ): Promise<V2CreateWarningPixDevolutionRestResponse> {
    // Create a payload.
    const payload: CreateWarningPixDevolutionRequest = {
      userId: user.uuid,
      operationId: body.operation_id,
    };

    logger.debug('Create warning devolution.', { user, payload });

    // Call create devolution service.
    const result = await createService.execute(payload);

    logger.debug('Warning devolution created.', result);

    const response = new V2CreateWarningPixDevolutionRestResponse(result);

    return response;
  }
}
