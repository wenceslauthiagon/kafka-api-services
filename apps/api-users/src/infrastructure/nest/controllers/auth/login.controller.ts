import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Logger } from 'winston';
import {
  ApiTags,
  ApiBody,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiProperty,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  Public,
  LoggerParam,
  IsMobilePhone,
  DefaultApiHeaders,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  LocalAuthGuard,
  AccessTokenProvider,
  RecaptchaGuard,
  RecaptchaBody,
} from '@zro/api-users/infrastructure';

export class AuthenticateRestRequest extends RecaptchaBody {
  @ApiProperty({
    description: 'User phone number.',
    example: '+5581912345678',
  })
  @IsMobilePhone()
  phone_number!: string;

  @ApiProperty({
    description: 'User defined password.',
    example: '1234',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  password!: string;

  constructor(props: AuthenticateRestRequest) {
    super(props);
  }
}

/**
 * Login response DTO.
 */
class AuthenticateRestResponse {
  @ApiProperty({
    type: 'string',
    description:
      'JWT access token. Token used to access all protected endpoints.',
  })
  access_token!: string;
}

/**
 * User authentication controller.
 */
@ApiTags('Authentication')
@Public()
@DefaultApiHeaders()
@Controller('auth/signin')
@UseGuards(LocalAuthGuard, RecaptchaGuard)
export class LoginAuthRestController {
  /**
   * Default constructor.
   *
   * @param accessTokenProvider Access token generator.
   */
  constructor(private readonly accessTokenProvider: AccessTokenProvider) {}

  /**
   * Login user by phone number and password. Authentication process is executed
   * by Passport local strategy.
   * @see LocalStrategy
   * @see LocalAuthGuard
   * @param user The logged user.
   * @param requestId HTTP request id,
   * @returns Authentication token.
   */
  @ApiOperation({
    deprecated: true,
    summary: 'Log user in.',
    description:
      'Log user in. User should know his phone number and password to receive an access token.',
  })
  @ApiBody({
    type: AuthenticateRestRequest,
    required: true,
    description: 'Login requires phone number and password.',
  })
  @ApiOkResponse({
    description: 'User authenticated successfully.',
    type: AuthenticateRestResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'User authentication failed.',
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Post()
  @HttpCode(HttpStatus.OK)
  @Throttle(1, 10)
  async execute(
    @AuthUserParam() user: AuthUser,
    @LoggerParam(LoginAuthRestController)
    logger: Logger,
  ): Promise<AuthenticateRestResponse> {
    logger.debug('Creating access token to user.', { user });

    // Generate access token to authenticated user.
    const accessToken =
      await this.accessTokenProvider.generateAccessToken(user);

    logger.debug('User access token created.', { user });

    return {
      access_token: accessToken,
    };
  }
}
