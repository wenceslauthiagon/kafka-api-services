import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
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
import { LoggerParam, Public } from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  LocalAuthGuard,
  AccessTokenProvider,
} from '@zro/api-paas/infrastructure';

export class AuthenticateRestRequest {
  @ApiProperty({
    description: 'User defined apiId.',
    example: 'b6bf15b4-e00f-4d03-8e2b-7ed8829c8ff6',
  })
  @IsNotEmpty()
  @IsUUID(4)
  api_id!: string;

  @ApiProperty({
    description: 'User defined apiKey.',
    example: 'abcd1234',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  api_key!: string;

  constructor(props: AuthenticateRestRequest) {
    Object.assign(this, props);
  }
}

/**
 * Login response DTO.
 */
export class AuthenticateRestResponse {
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
@Controller('auth/signin')
@UseGuards(LocalAuthGuard)
export class LoginAuthRestController {
  /**
   * Default constructor.
   *
   * @param accessTokenProvider Access token generator.
   */
  constructor(private readonly accessTokenProvider: AccessTokenProvider) {}

  /**
   * Login user by phone number and api key hash. Authentication process is executed
   * by Passport local strategy.
   *
   * @see LocalStrategy
   * @see LocalAuthGuard
   * @param user The logged user.
   * @returns Authentication token.
   */
  @ApiOperation({
    summary: 'Create an Access Token to log user in.',
    description:
      'Enter your API ID and API Key on the requisition body below and execute to get your Access Token. Your Access Token is necessary to log in under the Authorize section.',
  })
  @ApiBody({
    type: AuthenticateRestRequest,
    required: true,
    description: 'Create an Access Token requires an API ID and Api Key.',
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
