import {
  Controller,
  Param,
  HttpCode,
  HttpStatus,
  Delete,
} from '@nestjs/common';
import { IsUUID } from 'class-validator';
import { Logger } from 'winston';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiProperty,
} from '@nestjs/swagger';
import {
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { KeyType, KeyState, ClaimReasonType } from '@zro/pix-keys/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  CancelCodePixKeyRequest,
  CancelCodePixKeyResponse,
} from '@zro/pix-keys/interface';
import { pixKeyTypeRest, pixKeyStateRest } from '@zro/api-users/infrastructure';
import { CancelCodePixKeyServiceKafka } from '@zro/pix-keys/infrastructure';

/**
 * Cancel pix key start process rest params DTO.
 */
export class CancelCodePixKeyRestParams {
  @ApiProperty({
    description: 'Pix Key ID.',
  })
  @IsUUID(4)
  id!: string;
}

/**
 * Cancel pix key start process rest response DTO.
 */
export class CancelCodePixKeyRestResponse {
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

  constructor(props: CancelCodePixKeyResponse) {
    this.id = props.id;
    this.key = props.key;
    this.type = props.type;
    this.state = props.state;
    this.created_at = props.createdAt;
  }
}

/**
 * Cancel pix key start process rest controller.
 */
@ApiTags('Pix | Keys')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('pix/keys/:id/code')
@HasPermission('api-users-delete-pix-keys-by-id-code')
export class CancelCodePixKeyRestController {
  /**
   * Start cancel pix key process endpoint.
   */
  @ApiOperation({
    summary: 'Cancel pix key.',
    description: `Cancel pix key process. This route works to ${KeyState.PENDING} or ${KeyState.CLAIM_PENDING}. If key state is:<br>
    <ul>
      <li>${KeyState.PENDING}: key state will change to ${KeyState.CANCELED}.
      <li>${KeyState.CLAIM_PENDING}: a message will be sent to DICT and the key will be released to the claimer. Key state will change to ${KeyState.CLAIM_CLOSING}.
    </ul>
    Return key which state is ${KeyState.CANCELED} or ${KeyState.CLAIM_CLOSING}.`,
  })
  @ApiOkResponse({
    description: 'Key canceled.',
    type: CancelCodePixKeyRestResponse,
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
    @Param() params: CancelCodePixKeyRestParams,
    @KafkaServiceParam(CancelCodePixKeyServiceKafka)
    service: CancelCodePixKeyServiceKafka,
    @LoggerParam(CancelCodePixKeyRestController)
    logger: Logger,
  ): Promise<CancelCodePixKeyRestResponse> {
    // Create a payload.
    const payload: CancelCodePixKeyRequest = {
      userId: user.uuid,
      id: params.id,
      reason: ClaimReasonType.USER_REQUESTED,
    };

    logger.debug('Start cancel pix key.', { user, payload });

    // Call cancel pix key service.
    const result = await service.execute(payload);

    logger.debug('PixKey updated.', { result });

    const response = new CancelCodePixKeyRestResponse(result);

    return response;
  }
}
