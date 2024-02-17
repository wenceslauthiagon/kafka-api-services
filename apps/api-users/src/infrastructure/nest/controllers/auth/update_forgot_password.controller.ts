import {
  Controller,
  UseGuards,
  Logger,
  Body,
  Param,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiProperty,
  ApiCreatedResponse,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsString,
  Length,
  Matches,
  IsStrongPassword,
  IsUUID,
} from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import {
  Public,
  DefaultApiHeaders,
  LoggerParam,
  BcryptHashService,
  IsEqualThan,
  KafkaServiceParam,
} from '@zro/common';
import {
  RecaptchaGuard,
  RecaptchaBody,
  AccessTokenProvider,
} from '@zro/api-users/infrastructure';
import { UserEntity, UserForgotPasswordState } from '@zro/users/domain';
import { UpdateUserForgotPasswordServiceKafka } from '@zro/users/infrastructure';

class UpdateForgotPasswordRestParams {
  @ApiProperty({
    description: 'User forgot password ID.',
  })
  @IsUUID(4)
  id!: string;
}

class UpdateForgotPasswordRestRequest extends RecaptchaBody {
  @ApiProperty({
    description: 'Verification code.',
    example: '00000',
  })
  @IsString()
  @Length(5, 5)
  @Matches(/^[0-9]*$/)
  code!: string;

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
  new_password!: string;

  @ApiProperty({
    description: 'New password confirmation.',
    example: '007NoTimeToDi%',
  })
  @IsEqualThan('new_password')
  confirm_new_password!: string;

  constructor(props: UpdateForgotPasswordRestRequest) {
    super(props);
  }
}

/**
 * Forgot password response DTO.
 */
class UpdateForgotPasswordRestResponse {
  @ApiPropertyOptional({
    type: 'string',
    description:
      'JWT access token. Token used to access all protected endpoints.',
  })
  access_token?: string;

  @ApiPropertyOptional({
    description: 'Result of user forgot password operation.',
    enum: UserForgotPasswordState,
  })
  state!: string;
}

interface UpdateForgotPasswordRestConfig {
  APP_API_USERS_UPDATE_FORGOT_PASSWORD_SALT_ROUNDS: number;
}

/**
 * User forgot password controller.
 */
@ApiTags('Authentication')
@Public()
@DefaultApiHeaders()
@Controller('auth/forgot-password/:id')
@UseGuards(RecaptchaGuard)
export class UpdateForgotPasswordRestController {
  private readonly saltRounds: number;

  /**
   * Default constructor.
   * @param accessTokenProvider Access token generator.
   */
  constructor(
    configService: ConfigService<UpdateForgotPasswordRestConfig>,
    private readonly hashService: BcryptHashService,
    private readonly accessTokenProvider: AccessTokenProvider,
  ) {
    const salt = configService.get<number>(
      'APP_API_USERS_UPDATE_FORGOT_PASSWORD_SALT_ROUNDS',
    );

    this.saltRounds = salt ? Number(salt) : 10;
  }

  /**
   * User forgot password endpoint.
   */
  @ApiOperation({
    summary: 'Update Forgot password.',
    description:
      'User that forgot password should provider the verification code, new password and new password confirmation.',
  })
  @ApiCreatedResponse({
    description:
      'Update forgot password requires code, new password and new password confirmation.',
    type: UpdateForgotPasswordRestRequest,
  })
  @ApiOkResponse({
    description: 'User update forgot password successfully.',
    type: UpdateForgotPasswordRestResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'User update forgot password failed.',
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Patch()
  @Throttle(1, 10)
  async execute(
    @Param() params: UpdateForgotPasswordRestParams,
    @Body() body: UpdateForgotPasswordRestRequest,
    @KafkaServiceParam(UpdateUserForgotPasswordServiceKafka)
    service: UpdateUserForgotPasswordServiceKafka,
    @LoggerParam(UpdateForgotPasswordRestController)
    logger: Logger,
  ): Promise<UpdateForgotPasswordRestResponse> {
    const newPassword = this.hashService.hashSync(
      body.new_password,
      this.saltRounds,
    );

    const payload = {
      id: params.id,
      code: body.code,
      newPassword,
    };

    logger.debug('User update forgot password.', { payload });

    // Update user forgot password.
    const result = await service.execute(payload);

    const { state, userId, userPhoneNumber } = result;

    const stateIsConfirmed = state === UserForgotPasswordState.CONFIRMED;

    if (!stateIsConfirmed) {
      return {
        state,
        access_token: null,
      };
    }

    const user = new UserEntity({
      uuid: userId,
      phoneNumber: userPhoneNumber,
    });

    // Generate access token to authenticated user.
    const accessToken =
      await this.accessTokenProvider.generateAccessToken(user);

    logger.debug('User update forgot password successfully.', { accessToken });

    return {
      state,
      access_token: accessToken,
    };
  }
}
