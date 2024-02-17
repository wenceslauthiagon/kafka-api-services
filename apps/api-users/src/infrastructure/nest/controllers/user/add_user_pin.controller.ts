import { Controller, Body, UseGuards, Put } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { Logger } from 'winston';
import { IsString, Length } from 'class-validator';
import {
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
  BcryptHashService,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AddUserPinRequest, AddUserPinResponse } from '@zro/users/interface';
import {
  AuthUserParam,
  AddUserPinServiceKafka,
} from '@zro/users/infrastructure';
import { RecaptchaBody, RecaptchaGuard } from '@zro/api-users/infrastructure';

class AddUserPinBody extends RecaptchaBody {
  @ApiProperty({
    description: 'New pin for create.',
    example: '1234',
  })
  @IsString()
  @Length(4, 4)
  pin: string;
}

class AddUserPinRestResponse {
  @ApiProperty({
    description: 'User ID that change the PIN.',
    example: 6790,
  })
  user_id!: string;

  constructor(props: AddUserPinResponse) {
    this.user_id = props.uuid;
  }
}

interface AddUserPinRestConfig {
  APP_API_USERS_SALT_ROUNDS: number;
}

/**
 * User users controller. Controller is protected by JWT access token.
 */
@ApiTags('Users')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('users/pin')
@UseGuards(RecaptchaGuard)
@HasPermission('api-users-put-users-pin')
export class AddUserPinRestController {
  /**
   * Add user pin endpoint.
   */
  private readonly saltRounds: number;

  constructor(
    private readonly hashService: BcryptHashService,
    configService: ConfigService<AddUserPinRestConfig>,
  ) {
    this.saltRounds = Number(
      configService.get<number>('APP_API_USERS_SALT_ROUNDS', 10),
    );
  }

  @ApiOperation({
    summary: 'Create new pin for user.',
    description: 'Add new pin for existent user if user has not pin yet.',
  })
  @ApiCreatedResponse({
    description: 'User pin added.',
    type: AddUserPinRestResponse,
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
  @Put()
  async execute(
    @AuthUserParam() user: AuthUser,
    @Body() body: AddUserPinBody,
    @KafkaServiceParam(AddUserPinServiceKafka)
    service: AddUserPinServiceKafka,
    @LoggerParam(AddUserPinRestController)
    logger: Logger,
  ): Promise<AddUserPinRestResponse> {
    const newPinHash =
      body.pin && this.hashService.hashSync(body.pin, this.saltRounds);

    // Send a payload.
    const payload: AddUserPinRequest = {
      uuid: user.uuid,
      pin: newPinHash,
    };

    logger.debug('Send add user pin.', { user, payload });

    // Call send update users service.
    const result = await service.execute(payload);

    logger.debug('Users added pin sent.', { result });

    const response = new AddUserPinRestResponse(result);

    return response;
  }
}
