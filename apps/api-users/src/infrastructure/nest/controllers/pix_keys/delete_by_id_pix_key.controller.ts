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
import { PixKeyReasonType, KeyState, KeyType } from '@zro/pix-keys/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  DeleteByIdPixKeyRequest,
  DeleteByIdPixKeyResponse,
} from '@zro/pix-keys/interface';
import { pixKeyTypeRest, pixKeyStateRest } from '@zro/api-users/infrastructure';
import { DeleteByIdPixKeyServiceKafka } from '@zro/pix-keys/infrastructure';

export class DeleteByIdPixKeyParams {
  @ApiProperty({
    description: 'Pix Key ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  id!: string;
}

export class DeleteByIdPixKeyRestResponse {
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

  constructor(props: DeleteByIdPixKeyResponse) {
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
@Controller('pix/keys/:id')
@HasPermission('api-users-delete-pix-keys-by-id')
export class DeleteByIdPixKeyRestController {
  /**
   * delete pixKey endpoint.
   */
  @ApiOperation({
    summary: "Delete user's key.",
    description: `Delete user's key by id described in path. Send delete key request to DICT and changes key state to ${KeyState.DELETING}.
    Return deleted key which state is ${KeyState.DELETING}.`,
  })
  @ApiOkResponse({
    description: 'The pix key returned successfully.',
    type: DeleteByIdPixKeyRestResponse,
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
    @Param() params: DeleteByIdPixKeyParams,
    @KafkaServiceParam(DeleteByIdPixKeyServiceKafka)
    service: DeleteByIdPixKeyServiceKafka,
    @LoggerParam(DeleteByIdPixKeyRestController)
    logger: Logger,
  ): Promise<DeleteByIdPixKeyRestResponse> {
    // Create a payload.
    const payload: DeleteByIdPixKeyRequest = {
      userId: user.uuid,
      id: params.id,
      reason: PixKeyReasonType.USER_REQUESTED,
    };

    logger.debug('Delete a pixKey.', { user, payload });

    // Call delete pixKey service.
    const result = await service.execute(payload);

    logger.debug('PixKey deleted.', { result });

    const response = new DeleteByIdPixKeyRestResponse(result);

    return response;
  }
}
