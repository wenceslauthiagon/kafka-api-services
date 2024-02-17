import { Controller, Get, Param } from '@nestjs/common';
import { IsUUID } from 'class-validator';
import { Logger } from 'winston';
import { Throttle } from '@nestjs/throttler';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import {
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import { KeyState } from '@zro/pix-keys/domain';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { SendCodePixKeyRequest } from '@zro/pix-keys/interface';
import { SendCodePixKeyServiceKafka } from '@zro/pix-keys/infrastructure';

export class SendCodePixKeyParams {
  @ApiProperty({
    description: 'Pix Key ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  id!: string;
}

export interface SendCodePixKeyRestControllerConfig {
  APP_SEND_CODE_PIX_KEY_THROTTLE_LIMIT: number;
  APP_SEND_CODE_PIX_KEY_THROTTLE_TTL: number;
}

/**
 * User pix keys controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Keys')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('pix/keys/:id/code')
@HasPermission('api-users-get-pix-keys-by-id-code')
export class SendCodePixKeyRestController {
  /**
   * Get pixkey verification code endpoint. Code will be sent by key type
   * channel.
   */
  @ApiOperation({
    summary: 'Send confirmation code.',
    description: `Generate a new 5 digit code and send it by e-mail or SMS to the user.
      This route works to ${KeyState.PENDING} and ${KeyState.CLAIM_PENDING} states.`,
  })
  @ApiOkResponse({
    description: 'Code sent successfully.',
  })
  @ApiUnauthorizedResponse({
    description: 'User authentication failed.',
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @ApiNotFoundResponse({
    description: 'If the key id was not found.',
  })
  @Get()
  @Throttle(1, 60)
  async execute(
    @AuthUserParam() user: AuthUser,
    @Param() params: SendCodePixKeyParams,
    @KafkaServiceParam(SendCodePixKeyServiceKafka)
    sendCodePixKeyServiceKafka: SendCodePixKeyServiceKafka,
    @LoggerParam(SendCodePixKeyRestController)
    logger: Logger,
  ): Promise<void> {
    // Create a payload.
    const payload: SendCodePixKeyRequest = {
      userId: user.uuid,
      id: params.id,
    };

    logger.debug('Send pixKey verification code.', { user, payload });

    // Call create pixKey service.
    const result = await sendCodePixKeyServiceKafka.execute(payload);

    logger.debug('PixKey verification code sent.', { result });
  }
}
