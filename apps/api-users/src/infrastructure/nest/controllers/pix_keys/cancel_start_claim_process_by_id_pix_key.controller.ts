import { Controller, Param, Delete } from '@nestjs/common';
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
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import {
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { KeyState, KeyType } from '@zro/pix-keys/domain';
import {
  CancelStartClaimProcessByIdPixKeyRequest,
  CancelStartClaimProcessByIdPixKeyResponse,
} from '@zro/pix-keys/interface';
import { AuthUserParam } from '@zro/users/infrastructure';
import { pixKeyTypeRest, pixKeyStateRest } from '@zro/api-users/infrastructure';
import { CancelStartClaimProcessByIdPixKeyServiceKafka } from '@zro/pix-keys/infrastructure';

export class CancelStartClaimProcessByIdPixKeyParams {
  @ApiProperty({
    description: 'Pix Key ID.',
  })
  @IsUUID(4)
  id!: string;
}

export class CancelStartClaimProcessByIdPixKeyRestResponse {
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

  constructor(props: CancelStartClaimProcessByIdPixKeyResponse) {
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
@Controller('pix/keys/:id/claims/start')
@HasPermission('api-users-delete-pix-keys-by-id-claim-start')
export class CancelStartClaimProcessByIdPixKeyRestController {
  /**
   * cancel start claim process pixKey endpoint.
   */
  @ApiOperation({
    summary: 'Cancel ownership claim start process.',
    description: `Cancel ownership start process. Ownership claim process will not be started and key will remain in third party ISPB.
    If key state is:<br>
    <ul>
      <li>${KeyState.OWNERSHIP_PENDING}: ownership claim process will not start and key state will change to ${KeyState.CANCELED}.
    </ul>
    Return key which state is ${KeyState.CANCELED}.`,
  })
  @ApiOkResponse({
    description: 'The pix key returned successfully.',
    type: CancelStartClaimProcessByIdPixKeyRestResponse,
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
    @Param() params: CancelStartClaimProcessByIdPixKeyParams,
    @KafkaServiceParam(CancelStartClaimProcessByIdPixKeyServiceKafka)
    service: CancelStartClaimProcessByIdPixKeyServiceKafka,
    @LoggerParam(CancelStartClaimProcessByIdPixKeyRestController)
    logger: Logger,
  ): Promise<CancelStartClaimProcessByIdPixKeyRestResponse> {
    // Create a payload.
    const payload: CancelStartClaimProcessByIdPixKeyRequest = {
      userId: user.uuid,
      id: params.id,
    };

    logger.debug('Cancel start claim process of pixKey.', { user, payload });

    // Call cancel start claim process pixKey service.
    const result = await service.execute(payload);

    logger.debug('PixKey updated.', { result });

    const response = new CancelStartClaimProcessByIdPixKeyRestResponse(result);

    return response;
  }
}
