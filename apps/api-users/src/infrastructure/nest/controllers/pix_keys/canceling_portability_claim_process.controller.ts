import {
  Controller,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
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
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import {
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { ClaimReasonType, KeyState, KeyType } from '@zro/pix-keys/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  CancelingPortabilityClaimProcessRequest,
  CancelingPortabilityClaimProcessResponse,
} from '@zro/pix-keys/interface';
import { pixKeyTypeRest, pixKeyStateRest } from '@zro/api-users/infrastructure';
import { CancelingPortabilityClaimProcessServiceKafka } from '@zro/pix-keys/infrastructure';

export class CancelingPortabilityClaimProcessParams {
  @ApiProperty({
    description: 'Pix Key ID.',
  })
  @IsUUID(4)
  id!: string;
}

export class CancelingPortabilityClaimProcessRestResponse {
  @ApiProperty({
    description: 'Pix Key ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    description: 'Pix key.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  key!: string;

  @ApiProperty(pixKeyTypeRest)
  type!: KeyType;

  @ApiProperty(pixKeyStateRest)
  state!: KeyState;

  @ApiProperty({
    description: 'Pix Key created at.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: CancelingPortabilityClaimProcessResponse) {
    this.id = props.id;
    this.key = props.key;
    this.type = props.type;
    this.state = props.state;
    this.created_at = props.createdAt;
  }
}

/**
 * User pix keys controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Keys')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('pix/keys/:id/portabilities/cancel')
@HasPermission('api-users-delete-pix-keys-by-id-portabilities-cancel')
export class CancelingPortabilityClaimProcessRestController {
  /**
   * Canceling portability process endpoint.
   */
  @ApiOperation({
    summary: 'Cancel a portability claim that was created by this ZRO user.',
    description: `Cancel portability process. Portability will be stopped and the key will be canceled. If key state is:<br>
    <ul>
        <li>${KeyState.PORTABILITY_STARTED}: portability process will be canceled and key state will change to ${KeyState.PORTABILITY_CANCELING}.
    </ul>
    Return key which state is ${KeyState.PORTABILITY_CANCELING}.`,
  })
  @ApiOkResponse({
    description: 'The pix key returned successfully.',
    type: CancelingPortabilityClaimProcessRestResponse,
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
    description: 'If the key id was not found.',
  })
  @Delete()
  @HttpCode(HttpStatus.OK)
  async execute(
    @AuthUserParam() user: AuthUser,
    @Param() params: CancelingPortabilityClaimProcessParams,
    @KafkaServiceParam(CancelingPortabilityClaimProcessServiceKafka)
    service: CancelingPortabilityClaimProcessServiceKafka,
    @LoggerParam(CancelingPortabilityClaimProcessRestController)
    logger: Logger,
  ): Promise<CancelingPortabilityClaimProcessRestResponse> {
    // Create a payload.
    const payload: CancelingPortabilityClaimProcessRequest = {
      userId: user.uuid,
      id: params.id,
      reason: ClaimReasonType.USER_REQUESTED,
    };

    logger.debug('Canceling portability process of pixKey.', { user, payload });

    // Call pixKey service.
    const result = await service.execute(payload);

    logger.debug('PixKey updated.', { result });

    const response = new CancelingPortabilityClaimProcessRestResponse(result);

    return response;
  }
}
