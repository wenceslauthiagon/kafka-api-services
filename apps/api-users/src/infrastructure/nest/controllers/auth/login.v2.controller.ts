import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Version,
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
  IsMobilePhoneOrEmailOrDocument,
  DefaultApiHeaders,
  LoggerParam,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  V2LocalAuthGuard,
  AccessTokenProvider,
  RecaptchaGuard,
  RecaptchaBody,
} from '@zro/api-users/infrastructure';

export class V2AuthenticateRestRequest extends RecaptchaBody {
  @ApiProperty({
    description: 'User phone number, email or document (cpf or cnpj).',
    example: '+5581912345678',
  })
  @IsMobilePhoneOrEmailOrDocument()
  username!: string;

  @ApiProperty({
    description: 'User defined password.',
    example: '1234',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  password!: string;

  constructor(props: V2AuthenticateRestRequest) {
    super(props);
  }
}

/**
 * Login response DTO.
 */
class V2AuthenticateRestResponse {
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
@UseGuards(V2LocalAuthGuard, RecaptchaGuard)
export class V2LoginAuthRestController {
  /**
   * Default constructor.
   *
   * @param accessTokenProvider Access token generator.
   */
  constructor(private readonly accessTokenProvider: AccessTokenProvider) {}

  /**
   * Login user by username and password. Authentication process is executed
   * by Passport local strategy.
   * @see V2LocalStrategy
   * @see V2LocalAuthGuard
   * @param user The logged user.
   * @returns Authentication token.
   */
  @ApiOperation({
    summary: 'Create an Access Token to log user in.',
    description:
      'Enter your username (phone number, email, cpf or cnpj) and password on the requisition body below and execute to get your Access Token. Your Access Token is necessary to log in under the Authorize section.',
  })
  @ApiBody({
    type: V2AuthenticateRestRequest,
    required: true,
    description: 'Login requires username and password.',
  })
  @ApiOkResponse({
    description: 'User authenticated successfully.',
    type: V2AuthenticateRestResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'User authentication failed.',
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Version('2')
  @Post()
  @HttpCode(HttpStatus.OK)
  @Throttle(1, 10)
  async execute(
    @AuthUserParam() user: AuthUser,
    @LoggerParam(V2LoginAuthRestController)
    logger: Logger,
  ): Promise<V2AuthenticateRestResponse> {
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
