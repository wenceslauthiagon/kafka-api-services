/* eslint-disable @typescript-eslint/no-unused-vars */
import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiBody,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  AuthenticateRestRequest,
  AuthenticateRestResponse,
} from './dto/authenticate_rest.dto';

/**
 * client authentication controller.
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  /**
   * Login user by phone number and password. Authentication process is executed
   * by Passport local strategy.
   * @see LocalStrategy
   * @see LocalAuthGuard
   * @param req HTTP request.
   * @param requestId HTTP request id,
   * @returns Authentication token.
   */
  @ApiOperation({
    description: 'Log client in.',
  })
  @ApiBody({
    type: AuthenticateRestRequest,
    required: true,
  })
  @ApiOkResponse({
    description: 'Client authenticated successfully.',
    type: AuthenticateRestResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Client authentication failed.',
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    client: AuthenticateRestResponse,
  ): Promise<AuthenticateRestResponse> {
    return null;
  }
}
