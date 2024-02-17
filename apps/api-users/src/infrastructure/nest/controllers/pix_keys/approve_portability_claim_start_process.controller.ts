import { Controller, Post, Param, HttpCode, HttpStatus } from '@nestjs/common';
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
import { KeyType, KeyState } from '@zro/pix-keys/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  ApprovePortabilityClaimStartProcessRequest,
  ApprovePortabilityClaimStartProcessResponse,
} from '@zro/pix-keys/interface';
import { pixKeyTypeRest, pixKeyStateRest } from '@zro/api-users/infrastructure';
import { ApprovePortabilityClaimStartProcessServiceKafka } from '@zro/pix-keys/infrastructure';

/**
 * Approve portability claim start process rest params DTO.
 */
export class ApprovePortabilityClaimStartProcessRestParams {
  @ApiProperty({
    description: 'Pix Key ID.',
  })
  @IsUUID(4)
  id!: string;
}

/**
 * Approve portability claim start process rest response DTO.
 */
export class ApprovePortabilityClaimStartProcessRestResponse {
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

  constructor(props: ApprovePortabilityClaimStartProcessResponse) {
    this.id = props.id;
    this.key = props.key;
    this.type = props.type;
    this.state = props.state;
    this.created_at = props.createdAt;
  }
}

/**
 * Approve portability claim start process rest controller.
 */
@ApiTags('Pix | Keys')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('pix/keys/:id/portabilities/start')
@HasPermission('api-users-post-pix-keys-by-id-portabilities-start')
export class ApprovePortabilityClaimStartProcessRestController {
  /**
   * Start portability process endpoint.
   */
  @ApiOperation({
    summary: 'Approve portability start process.',
    description: `Allow Zrobank to start a portability process. If key state is:<br>
      <ul>
        <li>${KeyState.PORTABILITY_PENDING}: portability start process will be sent to DICT.
          After that, the user should be asked to approve portability in third party ISPB. Key state will change to ${KeyState.PORTABILITY_OPENED}.
      </ul>
      Return key which state is ${KeyState.PORTABILITY_OPENED}.`,
  })
  @ApiOkResponse({
    description: 'Portability claim process started successfully.',
    type: ApprovePortabilityClaimStartProcessRestResponse,
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
    @Param() params: ApprovePortabilityClaimStartProcessRestParams,
    @KafkaServiceParam(ApprovePortabilityClaimStartProcessServiceKafka)
    service: ApprovePortabilityClaimStartProcessServiceKafka,
    @LoggerParam(ApprovePortabilityClaimStartProcessRestController)
    logger: Logger,
  ): Promise<ApprovePortabilityClaimStartProcessRestResponse> {
    // Create a payload.
    const payload: ApprovePortabilityClaimStartProcessRequest = {
      userId: user.uuid,
      id: params.id,
    };

    logger.debug('Start portability process.', { user, payload });

    // Call start portability process service.
    const result = await service.execute(payload);

    logger.debug('PixKey updated.', { result });

    const response = new ApprovePortabilityClaimStartProcessRestResponse(
      result,
    );

    return response;
  }
}
