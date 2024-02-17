import { Body, Controller, Logger, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { IsString, IsStrongPassword, IsUUID, Length } from 'class-validator';
import {
  KafkaServiceParam,
  LoggerParam,
  BcryptHashService,
  DefaultApiHeaders,
  EnableReplayProtection,
  ForbiddenException,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { RecaptchaGuard, RecaptchaBody } from '@zro/api-users/infrastructure';
import {
  AuthUserParam,
  ChangeUserPasswordServiceKafka,
} from '@zro/users/infrastructure';
import {
  ChangeUserPasswordRequest,
  ChangeUserPasswordResponse,
} from '@zro/users/interface';

class ChangeUserPasswordBody extends RecaptchaBody {
  @ApiProperty({
    description: 'Old client password.',
    example: '007GoldenEye',
    required: true,
  })
  @IsString()
  @Length(8, 255)
  old_password: string;

  @ApiProperty({
    description: 'New password.',
    example: '007NoTimeToDi%',
  })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  new_password: string;
}

class ChangeUserPasswordRestResponse {
  @ApiProperty({
    description: 'User ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
    required: true,
  })
  @IsUUID(4)
  id: string;

  constructor(props: ChangeUserPasswordResponse) {
    this.id = props.id;
  }
}

interface ChangeUserPasswordRestConfig {
  APP_CHANGE_PASSWORD_SALT_ROUNDS: number;
}

/**
 * Change user password controller.
 */
@ApiTags('Authentication')
@Controller('auth/password')
@ApiBearerAuth()
@DefaultApiHeaders()
@UseGuards(RecaptchaGuard)
@EnableReplayProtection()
@HasPermission('api-users-post-auth-change-password')
export class ChangeUserPasswordRestController {
  private readonly saltRounds: number;

  constructor(
    private readonly hashService: BcryptHashService,
    configService: ConfigService<ChangeUserPasswordRestConfig>,
  ) {
    const salt = configService.get<number>('APP_CHANGE_PASSWORD_SALT_ROUNDS');

    this.saltRounds = salt ? Number(salt) : 10;
  }

  /**
   * change user password endpoint.
   */
  @ApiOperation({
    summary: 'Change user password.',
    description: 'Change user password using the old and the new password.',
  })
  @ApiCreatedResponse({
    description: 'User password updated successfully.',
    type: ChangeUserPasswordRestResponse,
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Post()
  async execute(
    @AuthUserParam() user: AuthUser,
    @KafkaServiceParam(ChangeUserPasswordServiceKafka)
    changePasswordService: ChangeUserPasswordServiceKafka,
    @LoggerParam(ChangeUserPasswordRestController)
    logger: Logger,
    @Body() body: ChangeUserPasswordBody,
  ): Promise<ChangeUserPasswordRestResponse> {
    const { old_password: oldPassword, new_password: newPassword } = body;

    const oldPasswordMatch = this.hashService.compareHash(
      oldPassword,
      user.password,
    );

    if (!oldPasswordMatch) {
      throw new ForbiddenException();
    }

    const newPasswordHash = this.hashService.hashSync(
      newPassword,
      this.saltRounds,
    );

    // Create a payload.
    const payload: ChangeUserPasswordRequest = {
      userId: user.uuid,
      password: newPasswordHash,
    };

    logger.debug('Change user password.', { payload });

    // Call change user password service.
    const result = await changePasswordService.execute(payload);

    logger.debug('User password updated.', { result });

    const response = new ChangeUserPasswordRestResponse(result);

    return response;
  }
}
