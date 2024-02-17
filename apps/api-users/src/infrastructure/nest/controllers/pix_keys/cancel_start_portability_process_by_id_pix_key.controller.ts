import { Controller, Param, Delete } from '@nestjs/common';
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
import { KeyState, KeyType } from '@zro/pix-keys/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  CancelStartPortabilityProcessByIdPixKeyRequest,
  CancelStartPortabilityProcessByIdPixKeyResponse,
} from '@zro/pix-keys/interface';
import { pixKeyTypeRest, pixKeyStateRest } from '@zro/api-users/infrastructure';
import { CancelStartPortabilityProcessByIdPixKeyServiceKafka } from '@zro/pix-keys/infrastructure';

export class CancelStartPortabilityProcessByIdPixKeyParams {
  @ApiProperty({
    description: 'Pix Key ID.',
  })
  @IsUUID(4)
  id!: string;
}

export class CancelStartPortabilityProcessByIdPixKeyRestResponse {
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

  constructor(props: CancelStartPortabilityProcessByIdPixKeyResponse) {
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
@Controller('pix/keys/:id/portabilities/start')
@HasPermission('api-users-delete-pix-keys-by-id-portabilities-start')
export class CancelStartPortabilityProcessByIdPixKeyRestController {
  /**
   * cancel start portability process pixKey endpoint.
   */
  @ApiOperation({
    summary: 'Cancel portability start process.',
    description: `Cancel portability start process. Portability process will not be started and key will remain in third party ISPB.
    If key state is:<br>
    <ul>
      <li>${KeyState.PORTABILITY_PENDING}: portability process will not start and key state will change to ${KeyState.CANCELED}.
    </ul>
    Return key which state is ${KeyState.CANCELED}.`,
  })
  @ApiOkResponse({
    description: 'The pix key returned successfully.',
    type: CancelStartPortabilityProcessByIdPixKeyRestResponse,
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
  async execute(
    @AuthUserParam() user: AuthUser,
    @Param() params: CancelStartPortabilityProcessByIdPixKeyParams,
    @KafkaServiceParam(CancelStartPortabilityProcessByIdPixKeyServiceKafka)
    service: CancelStartPortabilityProcessByIdPixKeyServiceKafka,
    @LoggerParam(CancelStartPortabilityProcessByIdPixKeyRestController)
    logger: Logger,
  ): Promise<CancelStartPortabilityProcessByIdPixKeyRestResponse> {
    // Create a payload.
    const payload: CancelStartPortabilityProcessByIdPixKeyRequest = {
      userId: user.uuid,
      id: params.id,
    };

    logger.debug('Cancel start portability process of pixKey.', {
      user,
      payload,
    });

    // Call cancel start portability process pixKey service.
    const result = await service.execute(payload);

    logger.debug('PixKey updated.', { result });

    const response = new CancelStartPortabilityProcessByIdPixKeyRestResponse(
      result,
    );

    return response;
  }
}
