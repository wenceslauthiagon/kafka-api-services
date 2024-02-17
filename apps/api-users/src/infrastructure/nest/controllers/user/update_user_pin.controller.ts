import { Controller, Body, UseGuards, Patch } from '@nestjs/common';
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
import {
  UpdateUserPinRequest,
  UpdateUserPinResponse,
} from '@zro/users/interface';
import {
  AuthUserParam,
  UpdateUserPinServiceKafka,
} from '@zro/users/infrastructure';
import {
  RecaptchaBody,
  RecaptchaGuard,
  PinGuard,
} from '@zro/api-users/infrastructure';

class UpdateUserPinBody extends RecaptchaBody {
  @ApiProperty({
    description: 'The new valid pin.',
    example: '1234',
  })
  @IsString()
  @Length(4, 4)
  new_pin: string;

  @ApiProperty({
    description: 'The old pin you want to replace.',
    example: '1234',
  })
  @IsString()
  @Length(4, 4)
  pin: string;
}

class UpdateUserPinRestResponse {
  @ApiProperty({
    description: 'User ID that change the PIN.',
    example: 6790,
  })
  user_id!: string;

  constructor(props: UpdateUserPinResponse) {
    this.user_id = props.uuid;
  }
}

interface UpdateUserPinRestConfig {
  APP_API_USERS_SALT_ROUNDS: number;
}

/**
 * User users controller. Controller is protected by JWT access token.
 */
@ApiTags('Users')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('users/pin')
@UseGuards(RecaptchaGuard, PinGuard)
@HasPermission('api-users-patch-users-pin')
export class UpdateUserPinRestController {
  /**
   * Update user pin endpoint.
   */
  private readonly saltRounds: number;

  constructor(
    private readonly hashService: BcryptHashService,
    configService: ConfigService<UpdateUserPinRestConfig>,
  ) {
    this.saltRounds = Number(
      configService.get<number>('APP_API_USERS_SALT_ROUNDS', 10),
    );
  }

  @ApiOperation({
    summary: 'Update existing pin for user.',
    description: 'Change old pin for new user PIN.',
  })
  @ApiCreatedResponse({
    description: 'User pin updated.',
    type: UpdateUserPinRestResponse,
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
  @Patch()
  async execute(
    @AuthUserParam() user: AuthUser,
    @Body() body: UpdateUserPinBody,
    @KafkaServiceParam(UpdateUserPinServiceKafka)
    service: UpdateUserPinServiceKafka,
    @LoggerParam(UpdateUserPinRestController)
    logger: Logger,
  ): Promise<UpdateUserPinRestResponse> {
    const newPinHash =
      body.new_pin && this.hashService.hashSync(body.new_pin, this.saltRounds);

    // Send a payload.
    const payload: UpdateUserPinRequest = {
      uuid: user.uuid,
      newPin: newPinHash,
    };

    logger.debug('Send update user pin.', { user, payload });

    // Call send update users service.
    const result = await service.execute(payload);

    logger.debug('Users update pin sent.', { result });

    const response = new UpdateUserPinRestResponse(result);

    return response;
  }
}
