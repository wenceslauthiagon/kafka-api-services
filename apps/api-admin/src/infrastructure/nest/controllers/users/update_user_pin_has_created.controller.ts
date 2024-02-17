import { Controller, Param, Patch } from '@nestjs/common';
import { Logger } from 'winston';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { KafkaServiceParam, LoggerParam } from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import { UpdateUserPinHasCreatedRequest } from '@zro/users/interface';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';
import { UpdateUserPinHasCreatedServiceKafka } from '@zro/users/infrastructure';

export class UpdateUserPinHasCreatedParams {
  @ApiProperty({
    description: 'User UUID.',
  })
  @IsUUID(4)
  id!: string;
}

/**
 * Update user pin has created controller. Controller is protected by admin JWT access token.
 */
@ApiTags('User')
@ApiBearerAuth()
@Controller('user/:id/pin/has-created')
export class UpdateUserPinHasCreatedRestController {
  /**
   * Update user pin has created endpoint.
   */
  @ApiOperation({
    summary: "Update user's 'pin has created' flag to false.",
    description:
      "Enter the user's ID below and execute to update its 'pin has created' flag to false.",
  })
  @ApiOkResponse({
    description: "User's 'pin has created' flag has been successfully updated.",
    type: null,
  })
  @ApiUnauthorizedResponse({
    description: 'Admin authentication failed.',
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Patch()
  async execute(
    @AuthAdminParam() admin: AuthAdmin,
    @KafkaServiceParam(UpdateUserPinHasCreatedServiceKafka)
    service: UpdateUserPinHasCreatedServiceKafka,
    @Param() params: UpdateUserPinHasCreatedParams,
    @LoggerParam(UpdateUserPinHasCreatedRestController)
    logger: Logger,
  ): Promise<void> {
    const { id } = params;

    // Create a payload.
    const payload: UpdateUserPinHasCreatedRequest = {
      uuid: id,
    };

    logger.debug('Updating user pin has created.', { admin, payload });

    // Call update user pin has created service.
    await service.execute(payload);

    logger.debug('Updated user pin has created.');
  }
}
