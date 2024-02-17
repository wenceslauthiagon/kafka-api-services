import {
  Controller,
  Logger,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiProperty,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import {
  DefaultApiHeaders,
  EnableReplayProtection,
  LoggerParam,
  KafkaServiceParam,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { DeclineUserForgotPasswordRequest } from '@zro/users/interface';
import {
  AuthUserParam,
  DeclineUserForgotPasswordServiceKafka,
} from '@zro/users/infrastructure';

class DeclineForgotPasswordParams {
  @ApiProperty({
    description: 'Forgot password UUID.',
  })
  @IsUUID(4)
  id: string;
}

/**
 * User forgot password controller.
 */
@ApiTags('Authentication')
@Controller('auth/forgot-password/:id')
@ApiBearerAuth()
@DefaultApiHeaders()
@EnableReplayProtection()
@HasPermission('api-users-delete-auth-forgot-password-by-id')
export class DeclineForgotPasswordRestController {
  /**
   * User forgot password endpoint.
   */
  @ApiOperation({
    summary: 'Decline forgot password request.',
    description: 'Decline user forgot password request.',
  })
  @ApiOkResponse({
    description: 'Decline user forgot password request successfully.',
  })
  @ApiUnauthorizedResponse({
    description: 'Decline user forgot password request failed.',
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Delete()
  @HttpCode(HttpStatus.OK)
  async execute(
    @AuthUserParam() user: AuthUser,
    @Param() params: DeclineForgotPasswordParams,
    @KafkaServiceParam(DeclineUserForgotPasswordServiceKafka)
    service: DeclineUserForgotPasswordServiceKafka,
    @LoggerParam(DeclineForgotPasswordRestController)
    logger: Logger,
  ): Promise<void> {
    const payload: DeclineUserForgotPasswordRequest = {
      id: params.id,
      userId: user.uuid,
    };

    logger.debug('Decline forgot password.', { payload });

    await service.execute(payload);

    logger.debug('User forgot password declined.');
  }
}
