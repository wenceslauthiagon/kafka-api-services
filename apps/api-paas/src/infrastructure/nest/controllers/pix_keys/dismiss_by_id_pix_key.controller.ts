import { Controller, Post, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { Logger } from 'winston';
import { IsUUID } from 'class-validator';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

import {
  DefaultApiHeaders,
  HasPermission,
  KafkaServiceParam,
  LoggerParam,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { KeyState, KeyType } from '@zro/pix-keys/domain';
import {
  DismissByIdPixKeyRequest,
  DismissByIdPixKeyResponse,
} from '@zro/pix-keys/interface';
import { pixKeyTypeRest, pixKeyStateRest } from '@zro/api-paas/infrastructure';
import { DismissByIdPixKeyServiceKafka } from '@zro/pix-keys/infrastructure';

class DismissByIdPixKeyParams {
  @ApiProperty({
    description: 'Pix Key ID.',
  })
  @IsUUID(4)
  id!: string;
}

class DismissByIdPixKeyRestResponse {
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

  constructor(props: DismissByIdPixKeyResponse) {
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
@Controller('pix/keys/:id/dismiss')
@HasPermission('api-paas-post-pix-keys-dismiss-by-id')
export class DismissByIdPixKeyRestController {
  /**
   * dismiss pixKey endpoint.
   */
  @ApiOperation({
    summary: 'Dismiss pix key by ID.',
    description: `Set key to do not be shown anymore. The key state will be changed to ${KeyState.CLAIM_PENDING}, ${KeyState.CANCELED} or ${KeyState.READY}. If key state is:<br>
    <ul>
      <li>${KeyState.CLAIM_NOT_CONFIRMED}: key state will change to ${KeyState.CLAIM_PENDING}.
      <li>${KeyState.PORTABILITY_REQUEST_AUTO_CONFIRMED}: key state will change to ${KeyState.CANCELED}.
      <li>${KeyState.PORTABILITY_CANCELED}: key state will change to ${KeyState.CANCELED}.
      <li>${KeyState.OWNERSHIP_CANCELED}: key state will change to ${KeyState.CANCELED}.
      <li>${KeyState.OWNERSHIP_CONFLICT}: key state will change to ${KeyState.CANCELED}.
      <li>${KeyState.PORTABILITY_READY}: key state will change to ${KeyState.READY}.
      <li>${KeyState.OWNERSHIP_READY}: key state will change to ${KeyState.READY}.
      <li>${KeyState.ADD_KEY_READY}: key state will change to ${KeyState.READY}.
      <li>${KeyState.DELETED}: key state will change to ${KeyState.CANCELED}.
      <li>${KeyState.NOT_CONFIRMED}: key state will change to ${KeyState.CANCELED}.
    </ul>
    Returns user's pix key which state is ${KeyState.CLAIM_PENDING}, ${KeyState.CANCELED} or ${KeyState.READY}.`,
  })
  @ApiOkResponse({
    description: 'The pix key returned successfully.',
    type: DismissByIdPixKeyRestResponse,
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
  @Post()
  @HttpCode(HttpStatus.OK)
  async execute(
    @AuthUserParam() user: AuthUser,
    @Param() params: DismissByIdPixKeyParams,
    @KafkaServiceParam(DismissByIdPixKeyServiceKafka)
    service: DismissByIdPixKeyServiceKafka,
    @LoggerParam(DismissByIdPixKeyRestController)
    logger: Logger,
  ): Promise<DismissByIdPixKeyRestResponse> {
    // Create a payload.
    const payload: DismissByIdPixKeyRequest = {
      userId: user.uuid,
      id: params.id,
    };

    logger.debug('Dismiss a pixKey.', { user, payload });

    // Call dismiss pixKey service.
    const result = await service.execute(payload);

    logger.debug('PixKey updated.', { result });

    const response = result && new DismissByIdPixKeyRestResponse(result);

    return response;
  }
}
