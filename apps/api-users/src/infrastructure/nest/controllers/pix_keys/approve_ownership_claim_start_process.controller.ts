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
  ApproveOwnershipClaimStartProcessRequest,
  ApproveOwnershipClaimStartProcessResponse,
} from '@zro/pix-keys/interface';
import { pixKeyTypeRest, pixKeyStateRest } from '@zro/api-users/infrastructure';
import { ApproveOwnershipClaimStartProcessServiceKafka } from '@zro/pix-keys/infrastructure';
/**
 * Approve ownership claim start process rest params DTO.
 */
export class ApproveOwnershipClaimStartProcessRestParams {
  @ApiProperty({
    description: 'Pix Key ID.',
  })
  @IsUUID(4)
  id!: string;
}

/**
 * Approve ownership claim start process rest response DTO.
 */
export class ApproveOwnershipClaimStartProcessRestResponse {
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

  constructor(props: ApproveOwnershipClaimStartProcessResponse) {
    this.id = props.id;
    this.key = props.key;
    this.type = props.type;
    this.state = props.state;
    this.created_at = props.createdAt;
  }
}

/**
 * Approve ownership claim start process rest controller.
 */
@ApiTags('Pix | Keys')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('pix/keys/:id/claims/start')
@HasPermission('api-users-post-pix-keys-by-id-claims-start')
export class ApproveOwnershipClaimStartProcessRestController {
  /**
   * Start ownership process endpoint.
   */
  @ApiOperation({
    summary: 'Approve ownership claim start process.',
    description: `Allow Zrobank to start an ownership claim process. If key state is:<br>
      <ul>
        <li>${KeyState.OWNERSHIP_PENDING}: ownership claim start process will be sent to DICT. Key state will change to ${KeyState.OWNERSHIP_OPENED}.
      </ul>
      Return key which state is ${KeyState.OWNERSHIP_OPENED}.`,
  })
  @ApiOkResponse({
    description: 'Ownership claim process started successfully.',
    type: ApproveOwnershipClaimStartProcessRestResponse,
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
    @Param() params: ApproveOwnershipClaimStartProcessRestParams,
    @KafkaServiceParam(ApproveOwnershipClaimStartProcessServiceKafka)
    service: ApproveOwnershipClaimStartProcessServiceKafka,
    @LoggerParam(ApproveOwnershipClaimStartProcessRestController)
    logger: Logger,
  ): Promise<ApproveOwnershipClaimStartProcessRestResponse> {
    // Create a payload.
    const payload: ApproveOwnershipClaimStartProcessRequest = {
      userId: user.uuid,
      id: params.id,
    };

    logger.debug('Start ownership process.', { user, payload });

    // Call start ownership process service.
    const result = await service.execute(payload);

    logger.debug('PixKey updated.', { result });

    const response = new ApproveOwnershipClaimStartProcessRestResponse(result);

    return response;
  }
}
