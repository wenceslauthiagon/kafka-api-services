import { Logger } from 'winston';
import { IsUUID } from 'class-validator';
import { Controller, Param, Delete } from '@nestjs/common';
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
import { AuthUser } from '@zro/users/domain';
import { DeleteByQrCodeStaticIdRequest } from '@zro/pix-payments/interface';
import { DeleteByQrCodeStaticIdServiceKafka } from '@zro/pix-payments/infrastructure';
import { AuthUserParam } from '@zro/users/infrastructure';

class DeleteByQrCodeStaticIdParams {
  @ApiProperty({
    description: "QR code's id.",
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  id: string;
}

/**
 * User pix payments controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Deposits')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('pix/deposits/qr-codes/static/:id')
@HasPermission('api-paas-delete-pix-deposits-qr-codes-by-id')
export class DeleteByQrCodeStaticIdRestController {
  /**
   * delete qrCodeStatic endpoint.
   */
  @ApiOperation({
    summary: "Delete user's QR code.",
    description: "Delete user's QR code by id described in path.",
  })
  @ApiOkResponse({
    description: 'Pix QR code deleted successfully.',
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
    description: 'If the Pix QR code static id was not found.',
  })
  @Delete()
  async execute(
    @AuthUserParam() user: AuthUser,
    @KafkaServiceParam(DeleteByQrCodeStaticIdServiceKafka)
    deleteByIdService: DeleteByQrCodeStaticIdServiceKafka,
    @LoggerParam(DeleteByQrCodeStaticIdRestController)
    logger: Logger,
    @Param() params: DeleteByQrCodeStaticIdParams,
  ): Promise<void> {
    // Create a payload.
    const payload: DeleteByQrCodeStaticIdRequest = {
      userId: user.uuid,
      id: params.id,
    };

    logger.debug('Delete a qrCodeStatic.', { user, payload });

    // Call delete qrCodeStatic service.
    await deleteByIdService.execute(payload);

    logger.debug('QrCodeStatic deleted.');
  }
}
