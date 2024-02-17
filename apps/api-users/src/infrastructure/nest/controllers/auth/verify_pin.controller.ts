import { Logger } from 'winston';
import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LoggerParam, DefaultApiHeaders, HasPermission } from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { PinGuard, PinBody } from '@zro/api-users/infrastructure';

class VerifyUserPinBody extends PinBody {}

/**
 * User verify pin controller.
 */
@ApiTags('Authentication')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('auth/verify-pin')
@UseGuards(PinGuard)
@HasPermission('api-users-post-auth-verify-pin')
export class VerifyPinAuthRestController {
  /**
   * Refresh token user receive expired or not access token, verify in refresh token guard and if was ok, generate new acces token.
   * @see RefreshTokenGuard
   * @returns Authentication token.
   */
  @ApiOperation({
    summary: 'Verify pin user.',
    description:
      'User send your pin for verify if this pin is correct and not is ban. This verification will occur after refresh token. Response will be only status code.',
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
  // Just call pin guard for validate user pin.
  async execute(
    @AuthUserParam() user: AuthUser,
    @LoggerParam(VerifyPinAuthRestController)
    logger: Logger,
    @Body() body: VerifyUserPinBody,
  ): Promise<void> {
    logger.debug('Calling validating user pin.', { user, body });
  }
}
