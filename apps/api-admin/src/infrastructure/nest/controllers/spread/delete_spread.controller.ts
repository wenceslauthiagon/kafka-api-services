import { Logger } from 'winston';
import { Controller, Body, Delete } from '@nestjs/common';
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
import { IsString, MaxLength } from 'class-validator';
import { InjectLogger, RequestId } from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import { DeleteSpreadRequest } from '@zro/otc/interface';
import {
  DeleteSpreadServiceKafka,
  AuthAdminParam,
} from '@zro/api-admin/infrastructure';

export class DeleteSpreadBody {
  @ApiProperty({
    description: 'Spread source symbol.',
    example: 'USD',
  })
  @IsString()
  @MaxLength(255)
  sourceSymbol!: string;
}

/**
 * Spread controller. Controller is protected by JWT access token.
 */
@ApiTags('Spread')
@ApiBearerAuth()
@Controller('quotations/spreads')
export class DeleteSpreadRestController {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param deleteService delete microservice.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly deleteService: DeleteSpreadServiceKafka,
  ) {
    this.logger = logger.child({ context: DeleteSpreadRestController.name });
  }

  /**
   * delete spread endpoint.
   */
  @ApiOperation({
    summary: 'Delete spreads.',
    description: 'Delete spreads.',
  })
  @ApiOkResponse({
    description: 'Spreads deleted successfully.',
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
  async execute(
    @AuthAdminParam() admin: AuthAdmin,
    @RequestId() requestId: string,
    @Body() body: DeleteSpreadBody,
  ): Promise<void> {
    const logger = this.logger.child({ loggerId: requestId });

    // Delete a payload.
    const payload: DeleteSpreadRequest = {
      currencySymbol: body.sourceSymbol,
    };

    logger.debug('Delete spreads.', { admin, payload });

    // Call delete spread service.
    await this.deleteService.execute(requestId, payload);

    logger.debug('Spread deleted.');
  }
}
