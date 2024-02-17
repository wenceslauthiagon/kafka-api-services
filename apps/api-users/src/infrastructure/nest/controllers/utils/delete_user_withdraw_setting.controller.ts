import { Logger } from 'winston';
import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { IsUUID } from 'class-validator';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  DefaultApiHeaders,
  EnableReplayProtection,
  HasPermission,
  KafkaServiceParam,
  LoggerParam,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { DeleteUserWithdrawSettingRequest } from '@zro/utils/interface';
import { DeleteUserWithdrawSettingServiceKafka } from '@zro/utils/infrastructure';
import { AuthUserParam } from '@zro/users/infrastructure';

class DeleteUserWithdrawSettingParams {
  @ApiProperty({
    description: 'User withdraw setting ID.',
  })
  @IsUUID(4)
  id: string;
}

/**
 * User withdraw setting controller. Controller is protected by JWT access token.
 */
@ApiTags('Utils | User Withdraw Settings')
@Controller('utils/user-withdraw-setting/:id')
@ApiBearerAuth()
@DefaultApiHeaders()
@EnableReplayProtection()
@HasPermission('api-users-delete-user-withdraw-setting')
export class DeleteUserWithdrawSettingRestController {
  /**
   * delete user withdraw setting endpoint.
   */
  @ApiOperation({
    summary: 'Delete an user withdraw setting',
    description: 'Deletes an user withdraw setting',
  })
  @ApiOkResponse({
    description: 'The user withdraw setting was deleted successfully.',
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
  @Delete()
  @HttpCode(HttpStatus.OK)
  async execute(
    @AuthUserParam() user: AuthUser,
    @Param() params: DeleteUserWithdrawSettingParams,
    @KafkaServiceParam(DeleteUserWithdrawSettingServiceKafka)
    service: DeleteUserWithdrawSettingServiceKafka,
    @LoggerParam(DeleteUserWithdrawSettingRestController)
    logger: Logger,
  ): Promise<void> {
    // DeleteUserWithdrawSetting payload.
    const payload: DeleteUserWithdrawSettingRequest = {
      id: params.id,
    };

    logger.debug('Delete user withdraw setting.', { user, payload });

    // Call delete user withdraw setting service.
    const result = await service.execute(payload);

    logger.debug('User withdraw setting deleted.', { result });
  }
}
