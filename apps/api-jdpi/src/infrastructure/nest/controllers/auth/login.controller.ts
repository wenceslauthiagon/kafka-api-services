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
  ApiConsumes,
} from '@nestjs/swagger';
import { Public, LoggerParam } from '@zro/common';
import { JdpiAuthClient } from '@zro/api-jdpi/domain';
import {
  AccessTokenProvider,
  JdpiAuthClientParam,
  LocalAuthGuard,
} from '@zro/api-jdpi/infrastructure';

export class AuthenticateRestRequest {
  @ApiProperty({
    description: 'Client Id.',
    example: '339440e4-dd22-47ed-8569-cc69075f3c0f',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  client_id!: string;

  @ApiProperty({
    description: 'Client secret.',
    example: '768a891e-ec9f-4f0d-9157-d75299f75344',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  client_secret!: string;

  @ApiProperty({
    description: 'Granted Access type.',
    example: 'client_credentials',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  grant_type!: string;

  @ApiProperty({
    description: 'Api group that will be accessed by access token.',
    example: 'sist_gct',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  scope!: string;

  constructor(props: AuthenticateRestRequest) {
    this.client_id = props.client_id;
    this.client_secret = props.client_secret;
    this.grant_type = props.grant_type;
    this.scope = props.scope;
  }
}

/**
 * Login response DTO.
 */
class AuthenticateRestResponse {
  @ApiProperty({
    description:
      'JWT access token. Token used to access all protected endpoints.',
  })
  access_token!: string;

  @ApiProperty({
    description: 'JWT access token expire data.',
    example: 1591743677,
  })
  expires_in!: number;

  @ApiProperty({
    description: 'Access token type.',
    example: 'Bearer',
  })
  token_type!: string;

  @ApiProperty({
    description: 'Api group that will be accessed by access token.',
    example: 'sist_gct',
  })
  scope!: string;
}

/**
 * Jdpi client authentication controller.
 */
@ApiTags('Authentication')
@Public()
@Controller('auth/signin')
@UseGuards(LocalAuthGuard)
export class LoginAuthRestController {
  private readonly TOKEN_TYPE: string = 'Bearer';

  /**
   * Default constructor.
   *
   * @param accessTokenProvider Access token generator.
   */
  constructor(private readonly accessTokenProvider: AccessTokenProvider) {}

  /**
   * Login jdpiClient by id and secret. Authentication process is executed
   * by Passport local strategy.
   * @see LocalStrategy
   * @see LocalAuthGuard
   * @returns Authentication response.
   */
  @ApiConsumes('application/x-www-form-urlencoded')
  @ApiOperation({
    summary: 'Create an Access Token to log Jdpi client in.',
    description:
      'Enter your Jdpi client ID, secret, grant type and scope. Your Access Token is necessary to log in under the Authorize section.',
  })
  @ApiBody({
    type: AuthenticateRestRequest,
    required: true,
    description:
      'Login requires client_id, client_secret, grant_type and scope.',
  })
  @ApiOkResponse({
    description: 'Jdpi client authenticated successfully.',
    type: AuthenticateRestResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Jdpi client authentication failed.',
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Post()
  @HttpCode(HttpStatus.OK)
  async execute(
    @JdpiAuthClientParam()
    client: JdpiAuthClient,
    @LoggerParam(LoginAuthRestController)
    logger: Logger,
  ): Promise<AuthenticateRestResponse> {
    logger.debug('Creating access token to Jdpi client.', { client });

    // Generate access token to authenticated Jdpi client.
    const { accessToken, expiresIn } =
      await this.accessTokenProvider.generateAccessToken(client);

    logger.debug('Client access token created.', { client });

    return {
      access_token: accessToken,
      expires_in: expiresIn,
      token_type: this.TOKEN_TYPE,
      scope: client.scope,
    };
  }
}
