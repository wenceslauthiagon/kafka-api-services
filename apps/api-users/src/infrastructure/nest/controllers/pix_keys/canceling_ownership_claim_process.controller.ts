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
  CancelingOwnershipClaimProcessRequest,
  CancelingOwnershipClaimProcessResponse,
} from '@zro/pix-keys/interface';
import { pixKeyTypeRest, pixKeyStateRest } from '@zro/api-users/infrastructure';
import { CancelingOwnershipClaimProcessServiceKafka } from '@zro/pix-keys/infrastructure';

export class CancelingOwnershipClaimProcessParams {
  @ApiProperty({
    description: 'Pix Key ID.',
  })
  @IsUUID(4)
  id!: string;
}

export class CancelingOwnershipClaimProcessRestResponse {
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

  constructor(props: CancelingOwnershipClaimProcessResponse) {
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
@Controller('pix/keys/:id/claims/cancel')
@HasPermission('api-users-delete-pix-keys-by-id-claims-cancel')
export class CancelingOwnershipClaimProcessRestController {
  /**
   * Canceling ownership process endpoint.
   */
  @ApiOperation({
    summary: 'Cancel a ownership claim that was created by this ZRO user.',
    description: `Cancel ownership process. Portability will be stopped and the key will be canceled. If key state is:<br>
    <ul>
        <li>${KeyState.OWNERSHIP_WAITING}: ownership process will be canceled and key state will change to ${KeyState.OWNERSHIP_CANCELING}.
    </ul>
    Return key which state is ${KeyState.OWNERSHIP_CANCELING}.`,
  })
  @ApiOkResponse({
    description: 'The pix key returned successfully.',
    type: CancelingOwnershipClaimProcessRestResponse,
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
    @Param() params: CancelingOwnershipClaimProcessParams,
    @KafkaServiceParam(CancelingOwnershipClaimProcessServiceKafka)
    service: CancelingOwnershipClaimProcessServiceKafka,
    @LoggerParam(CancelingOwnershipClaimProcessRestController)
    logger: Logger,
  ): Promise<CancelingOwnershipClaimProcessRestResponse> {
    // Create a payload.
    const payload: CancelingOwnershipClaimProcessRequest = {
      userId: user.uuid,
      id: params.id,
      reason: ClaimReasonType.USER_REQUESTED,
    };

    logger.debug('Canceling claim process of pixKey.', { user, payload });

    // Call pixKey service.
    const result = await service.execute(payload);

    logger.debug('PixKey updated.', { result });

    const response = new CancelingOwnershipClaimProcessRestResponse(result);

    return response;
  }
}
