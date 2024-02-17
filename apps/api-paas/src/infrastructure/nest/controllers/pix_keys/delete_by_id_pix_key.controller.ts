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
  DefaultApiHeaders,
  HasPermission,
  KafkaServiceParam,
  LoggerParam,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { PixKeyReasonType, KeyState, KeyType } from '@zro/pix-keys/domain';
import {
  DeleteByIdPixKeyRequest,
  DeleteByIdPixKeyResponse,
} from '@zro/pix-keys/interface';
import { pixKeyTypeRest, pixKeyStateRest } from '@zro/api-paas/infrastructure';
import { DeleteByIdPixKeyServiceKafka } from '@zro/pix-keys/infrastructure';

class DeleteByIdPixKeyParams {
  @ApiProperty({
    description: 'Pix Key ID.',
  })
  @IsUUID(4)
  id!: string;
}

class DeleteByIdPixKeyRestResponse {
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
@HasPermission('api-paas-delete-pix-keys-by-id')
export class DeleteByIdPixKeyRestController {
  /**
   * delete pixKey endpoint.
   */
  @ApiOperation({
    summary: 'Delete pix key by ID.',
    description: `Enter the user's pix key ID below and execute to delete it. After deleted, the returned pix key's state will be ${KeyState.DELETING}.`,
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
      id: params.id,
      userId: user.uuid,
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
