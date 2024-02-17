import {
  Controller,
  Body,
  Post,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { Logger } from 'winston';
import {
  ApiProperty,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiBearerAuth,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { InjectLogger, RequestId } from '@zro/common';
import {
  NotifyRegisterBankingTedEntity,
  NotifyRegisterBankingTedStatus,
} from '@zro/api-topazio/domain';
import { TopazioServiceKafka } from '@zro/api-topazio/infrastructure';

export class NotifyRegisterBankingTedParams {
  @ApiProperty({
    description: 'Transaction unique id.',
    example: 'fb96cf13-4600-4d21-ad67-40fc05ac3a8d',
  })
  transaction_id!: string;
}

export class NotifyRegisterBankingTedBody {
  @ApiProperty({
    description: 'Notification BankingTed status.',
    enum: NotifyRegisterBankingTedStatus,
    example: NotifyRegisterBankingTedStatus.TED_FORWARDED,
  })
  status: NotifyRegisterBankingTedStatus;

  @ApiPropertyOptional({
    description: 'Code when ted failed.',
    example: '12341234',
  })
  code: string;

  @ApiPropertyOptional({
    description: 'Message when ted failed.',
    example: 'This message for failed',
  })
  message: string;
}

/**
 * Notify register banking ted controller.
 */
@ApiBearerAuth()
@ApiTags('Banking | TED')
@Controller('notify-register/banking/ted/:transaction_id')
export class NotifyRegisterBankingTedRestController {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param service topazio service.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly service: TopazioServiceKafka,
  ) {
    this.logger = logger.child({
      context: NotifyRegisterBankingTedRestController.name,
    });
  }

  /**
   * Create notifyRegister banking ted endpoint.
   */
  @ApiOperation({
    description: 'Notify register banking ted.',
  })
  @ApiOkResponse({
    description: 'Notification successfully received.',
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Post()
  @HttpCode(HttpStatus.OK)
  async execute(
    @Body() data: NotifyRegisterBankingTedBody,
    @Param() params: NotifyRegisterBankingTedParams,
    @RequestId() requestId: string,
  ): Promise<void> {
    const logger = this.logger.child({ loggerId: requestId });

    // Create a payload.
    const payload = new NotifyRegisterBankingTedEntity({
      transactionId: params.transaction_id,
      code: data.code,
      message: data.message,
      status: data.status,
    });
    logger.debug('Notify register banking ted in topazio.', { payload });

    // Call create pixKey service.
    await this.service.notifyRegisterBankingTed(requestId, payload);

    logger.debug('Notify banking ted created and event emmited.');
  }
}
