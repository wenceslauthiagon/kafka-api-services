import { Controller, Body, Post } from '@nestjs/common';
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
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength, ValidateIf } from 'class-validator';
import {
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
  HasPermission,
  RequestTransactionId,
  TransactionApiHeader,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { KeyState, KeyType } from '@zro/pix-keys/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  CreatePixKeyRequest,
  CreatePixKeyResponse,
} from '@zro/pix-keys/interface';
import { pixKeyTypeRest, pixKeyStateRest } from '@zro/api-users/infrastructure';
import { CreatePixKeyServiceKafka } from '@zro/pix-keys/infrastructure';

export class CreatePixKeyBody {
  @ApiProperty(pixKeyTypeRest)
  @IsEnum(KeyType)
  type!: KeyType;

  @ApiPropertyOptional({
    description: 'Pix key.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @ValidateIf((obj: CreatePixKeyBody) =>
    [KeyType.EMAIL, KeyType.PHONE].includes(obj.type),
  )
  @IsString()
  @MaxLength(77)
  key?: string;
}

export class CreatePixKeyRestResponse {
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
@HasPermission('api-users-post-pix-keys')
export class CreatePixKeyRestController {
  /**
   * create pixKey endpoint.
   */
  @ApiOperation({
    summary: 'Add a new key to the user.',
    description: `Add a new key to the user. Allowed key types:<br>
    <ul>
      <li>${KeyType.CPF}: create a new key based on the document available in the user profile.
      <li>${KeyType.EMAIL}: create a new key associated with an arbitrary e-mail. An e-mail will be sent with 5 digit code to validate it.
      <li>${KeyType.PHONE}: create e new key associated with an arbitrary phone number. A SMS will be sent with 5 digit code to validate it.
      <li>${KeyType.EVP}: create a random key.
      <li>${KeyType.CNPJ}: create a new key based on the document available in the user profile.
    </ul>
    Return a created key which state is ${KeyState.PENDING} (types ${KeyType.PHONE} or ${KeyType.EMAIL}) or ${KeyState.CONFIRMED} (types ${KeyType.CPF} or ${KeyType.EVP}).<br>
    <b>PS: The mobile app should call GET /pix/keys/{id}/code to send a code (e-mail or SMS) to the user.<b>`,
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
    @Body() body: CreatePixKeyBody,
    @KafkaServiceParam(CreatePixKeyServiceKafka)
    service: CreatePixKeyServiceKafka,
    @LoggerParam(CreatePixKeyRestController)
    logger: Logger,
    @RequestTransactionId() transactionId: string,
  ): Promise<CreatePixKeyRestResponse> {
    // Create a payload.
    const payload: CreatePixKeyRequest = {
      userId: user.uuid,
      id: transactionId,
      type: body.type,
      key: body.key,
    };

    logger.debug('Create pixKey.', { user, payload });

    // Call create pixKey service.
    const result = await service.execute(payload);

    logger.debug('PixKey created.', result);

    const response = result && new CreatePixKeyRestResponse(result);

    return response;
  }
}
