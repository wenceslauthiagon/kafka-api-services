import { Controller, Param, HttpCode, HttpStatus, Post } from '@nestjs/common';
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
  ApprovePortabilityClaimProcessRequest,
  ApprovePortabilityClaimProcessResponse,
} from '@zro/pix-keys/interface';
import { pixKeyTypeRest, pixKeyStateRest } from '@zro/api-users/infrastructure';
import { ApprovePortabilityClaimProcessServiceKafka } from '@zro/pix-keys/infrastructure';

export class ApprovePortabilityClaimProcessParams {
  @ApiProperty({
    description: 'Pix Key ID.',
  })
  @IsUUID(4)
  id!: string;
}

export class ApprovePortabilityClaimProcessRestResponse {
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

  constructor(props: ApprovePortabilityClaimProcessResponse) {
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
@Controller('pix/keys/:id/portabilities/approve')
@HasPermission('api-users-post-pix-keys-by-id-portabilities-approve')
export class ApprovePortabilityClaimProcessRestController {
  /**
   * Approve portability process endpoint.
   */
  @ApiOperation({
    summary: 'Approve portability process.',
    description: `Approve a portability process. Key will be available to third party ISPB.. If key state is:<br>
    <ul>
        <li>${KeyState.PORTABILITY_REQUEST_PENDING}: portability will be approved and key state will change to ${KeyState.CANCELED}.
    </ul>
    Return key which state is ${KeyState.CANCELED}.`,
  })
  @ApiOkResponse({
    description: 'The pix key returned successfully.',
    type: ApprovePortabilityClaimProcessRestResponse,
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
    @Param() params: ApprovePortabilityClaimProcessParams,
    @KafkaServiceParam(ApprovePortabilityClaimProcessServiceKafka)
    service: ApprovePortabilityClaimProcessServiceKafka,
    @LoggerParam(ApprovePortabilityClaimProcessRestController)
    logger: Logger,
  ): Promise<ApprovePortabilityClaimProcessRestResponse> {
    // Create a payload.
    const payload: ApprovePortabilityClaimProcessRequest = {
      userId: user.uuid,
      id: params.id,
      reason: ClaimReasonType.USER_REQUESTED,
    };

    logger.debug('Approve claim process of pixKey.', { user, payload });

    // Call pixKey service.
    const result = await service.execute(payload);

    logger.debug('PixKey updated.', { result });

    const response = new ApprovePortabilityClaimProcessRestResponse(result);

    return response;
  }
}
