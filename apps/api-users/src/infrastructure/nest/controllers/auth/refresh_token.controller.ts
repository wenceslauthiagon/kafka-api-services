import { Logger } from 'winston';
import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiProperty,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public, LoggerParam, DefaultApiHeaders } from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  AccessTokenProvider,
  RefreshTokenGuard,
  RefreshTokenApiHeader,
} from '@zro/api-users/infrastructure';

/**
 * Refresh token response with new access token DTO.
 */
class RefreshTokenRestResponse {
  @ApiProperty({
    type: 'string',
    description:
      'JWT access token. Token used to access all protected endpoints.',
  })
  access_token!: string;
}

/**
 * User refresh token controller.
 */
@ApiTags('Authentication')
@Public()
@DefaultApiHeaders()
@RefreshTokenApiHeader()
@Controller('auth/refresh-token')
@UseGuards(RefreshTokenGuard)
export class RefreshTokenAuthRestController {
  /**
   * Default constructor.
   * @param accessTokenProvider Access token generator.
   */
  constructor(private readonly accessTokenProvider: AccessTokenProvider) {}

  /**
   * Refresh token user receive expired or not access token, verify in refresh token guard and if was ok, generate new acces token.
   * @see RefreshTokenGuard
   * @param requestId HTTP request id,
   * @returns Authentication token.
   */
  @ApiOperation({
    summary: 'Refresh token user.',
    description:
      'User should inform authorization old access token in header and a new access token will be generated.',
  })
  @ApiOkResponse({
    description: 'User authenticated successfully.',
    type: RefreshTokenRestResponse,
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
  @Throttle(1, 60)
  async execute(
    @AuthUserParam() user: AuthUser,
    @LoggerParam(RefreshTokenAuthRestController)
    logger: Logger,
  ): Promise<RefreshTokenRestResponse> {
    logger.debug(
      'Creating refresh in guard and generating new access token to user.',
      { user },
    );

    // Generate access token to authenticated user.
    const accessToken =
      await this.accessTokenProvider.generateAccessToken(user);

    logger.debug('User access token created.', { user });

    return {
      access_token: accessToken,
    };
  }
}
