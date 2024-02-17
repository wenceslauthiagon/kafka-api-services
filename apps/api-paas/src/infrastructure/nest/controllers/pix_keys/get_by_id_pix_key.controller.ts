import { Logger } from 'winston';
import { Controller, Param, Get } from '@nestjs/common';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
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
import { KeyState, KeyType } from '@zro/pix-keys/domain';
import {
  GetByIdPixKeyRequest,
  GetByIdPixKeyResponse,
} from '@zro/pix-keys/interface';
import { pixKeyTypeRest, pixKeyStateRest } from '@zro/api-paas/infrastructure';
import { GetPixKeyByIdServiceKafka } from '@zro/pix-keys/infrastructure';

class GetByIdPixKeyParams {
  @ApiProperty({
    description: 'Pix Key ID.',
  })
  @IsUUID(4)
  id!: string;
}

class GetByIdPixKeyRestResponse {
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

  @ApiProperty({
    description: 'Pix Key failed message.',
  })
  failed_message?: string;

  constructor(props: GetByIdPixKeyResponse) {
    this.id = props.id;
    this.key = props.key;
    this.type = props.type;
    this.state = props.state;
    this.created_at = props.createdAt;
    this.failed_message = props.failed?.message;
  }
}

/**
 * User pix keys controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Keys')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('pix/keys/:id')
@HasPermission('api-paas-get-pix-keys-by-id')
export class GetByIdPixKeyRestController {
  /**
   * get pixKey endpoint.
   */
  @ApiOperation({
    summary: 'Get pix key by ID.',
    description:
      'Enter the pix key ID below and execute to get its state and all information. Canceled keys are not returned (422 error will be sent).',
  })
  @ApiOkResponse({
    description:
      'The pix key returned successfully. Returns null if key id is not found.',
    type: GetByIdPixKeyRestResponse,
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
  @Get()
  async execute(
    @AuthUserParam() user: AuthUser,
    @Param() params: GetByIdPixKeyParams,
    @KafkaServiceParam(GetPixKeyByIdServiceKafka)
    service: GetPixKeyByIdServiceKafka,
    @LoggerParam(GetByIdPixKeyRestController)
    logger: Logger,
  ): Promise<GetByIdPixKeyRestResponse> {
    // Create a payload.
    const payload: GetByIdPixKeyRequest = {
      userId: user.uuid,
      id: params.id,
    };

    logger.debug('Getting a pixKey.', { user, payload });

    // Call get pixKey service.
    const result = await service.execute(payload);

    logger.debug('PixKey found.', { result });

    const response = result && new GetByIdPixKeyRestResponse(result);

    return response;
  }
}
