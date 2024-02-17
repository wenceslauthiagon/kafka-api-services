import {
  Controller,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsEmail, IsString, MaxLength } from 'class-validator';
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
import { InjectLogger, Public, RequestId } from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import {
  LocalAuthGuard,
  AccessTokenProvider,
  AuthAdminParam,
} from '@zro/api-admin/infrastructure';

/**
 * Login request DTO.
 */
export class AuthenticateRestRequest {
  @ApiProperty({
    description: 'Admin email.',
    example: 'admin@zrobank.com.br',
  })
  @IsString()
  @MaxLength(255)
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Admin defined password.',
    example: '1234',
  })
  @MaxLength(255)
  @IsString()
  password!: string;

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
  accessToken!: string;
}

/**
 * Admin authentication controller.
 */
@ApiTags('Authentication')
@Public()
@Controller('auth/login')
@UseGuards(LocalAuthGuard)
export class LoginAuthRestController {
  /**
   * Default constructor.
   *
   * @param logger Global logger
   * @param accessTokenProvider Access token generator.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private accessTokenProvider: AccessTokenProvider,
  ) {
    this.logger = logger.child({ context: LoginAuthRestController.name });
  }

  /**
   * Login admin by email and password. Authentication process is executed
   * by Passport local strategy.
   * @see LocalStrategy
   * @see LocalAuthGuard
   * @param admin The logged admin.
   * @param requestId HTTP request id,
   * @returns Authentication token.
   */
  @ApiOperation({
    description:
      'Log admin in. Admin should know his email and password to receive an access token.',
  })
  @ApiBody({
    type: AuthenticateRestRequest,
    required: true,
    description: 'Login requires email and password.',
  })
  @ApiOkResponse({
    description: 'Admin authenticated successfully.',
    type: AuthenticateRestResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Admin authentication failed.',
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Post()
  @HttpCode(HttpStatus.OK)
  async execute(
    @AuthAdminParam() admin: AuthAdmin,
    @RequestId() requestId: string,
  ): Promise<AuthenticateRestResponse> {
    const logger = this.logger.child({ loggerId: requestId });

    logger.debug('Creating access token to admin.', { admin });

    // Generate access token to authenticated admin.
    const accessToken = this.accessTokenProvider.generateAccessToken(admin);

    logger.debug('Admin access token created.', { admin });

    return {
      accessToken,
    };
  }
}
