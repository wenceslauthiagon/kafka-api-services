import { Controller, Post } from '@nestjs/common';
import { Logger } from 'winston';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import {
  DefaultApiHeaders,
  HasPermission,
  KafkaServiceParam,
  LoggerParam,
  RequestTransactionId,
  TransactionApiHeader,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { KeyState, KeyType } from '@zro/pix-keys/domain';
import {
  CreatePixKeyRequest,
  CreatePixKeyResponse,
} from '@zro/pix-keys/interface';
import {
  pixKeyEvpTypeRest,
  pixKeyStateRest,
} from '@zro/api-paas/infrastructure';
import { CreatePixKeyServiceKafka } from '@zro/pix-keys/infrastructure';

class CreatePixKeyRestResponse {
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

  @ApiProperty(pixKeyEvpTypeRest)
  type!: KeyType;

  @ApiProperty(pixKeyStateRest)
  state!: KeyState;

  @ApiProperty({
    description: 'Pix Key created at.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: CreatePixKeyResponse) {
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
@TransactionApiHeader()
@Controller('pix/keys')
@HasPermission('api-paas-post-pix-keys')
export class CreatePixKeyRestController {
  /**
   * create pixKey endpoint.
   */
  @ApiOperation({
    summary: 'Create new random key.',
    description: 'Create a new EVP key type (random key) to the user.',
  })
  @ApiCreatedResponse({
    description: 'The pix key returned successfully.',
    type: CreatePixKeyRestResponse,
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
  @Post()
  async execute(
    @AuthUserParam() user: AuthUser,
    @KafkaServiceParam(CreatePixKeyServiceKafka)
    service: CreatePixKeyServiceKafka,
    @LoggerParam(CreatePixKeyRestController)
    logger: Logger,
    @RequestTransactionId() transactionId: string,
  ): Promise<CreatePixKeyRestResponse> {
    // Create a payload.
    const payload: CreatePixKeyRequest = {
      id: transactionId,
      userId: user.uuid,
      type: KeyType.EVP,
    };

    logger.debug('Create pix key.', { user, payload });

    // Call create pixKey service.
    const result = await service.execute(payload);

    logger.debug('Pix key created.', result);

    const response = result && new CreatePixKeyRestResponse(result);

    return response;
  }
}
