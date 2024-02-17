import { Controller, Body, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { Logger } from 'winston';
import { Transform } from 'class-transformer';
import {
  ApiProperty,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  formatBranch,
  formatIspb,
  formatValueFromFloatToInt,
  InjectLogger,
  RequestId,
  SanitizeHtml,
} from '@zro/common';
import { AccountType } from '@zro/pix-payments/domain';
import { NotifyCompletionEntity, StatusType } from '@zro/api-topazio/domain';
import { TopazioServiceKafka } from '@zro/api-topazio/infrastructure';

export class NotifyCompletionBody {
  @ApiProperty({
    description: 'Transaction unique id.',
    example: 'fb96cf13-4600-4d21-ad67-40fc05ac3a8d',
  })
  transactionId!: string;

  @ApiProperty({
    description: 'Devolution flag.',
    example: false,
  })
  isDevolution!: boolean;

  @ApiProperty({
    description: 'Transaction status.',
    enum: StatusType,
    example: StatusType.COMPLETED,
  })
  status: StatusType;

  @ApiProperty({
    description: 'TxId.',
    example: 'bdb98227-3e02-4fa2-8e71-bfb8e4b4310a',
  })
  txId: string;

  @ApiProperty({
    description: 'Transaction amount.',
    example: '12.45',
  })
  @Transform((params) => formatValueFromFloatToInt(params.value))
  amount: number;

  @ApiProperty({
    description: 'Client ispb.',
    example: '26264220',
  })
  @Transform((params) => formatIspb(params.value))
  clientIspb: string;

  @ApiProperty({
    description: 'Client branch.',
    example: '0001',
  })
  @Transform((params) => formatBranch(params.value))
  clientBranch: string;

  @ApiProperty({
    description: 'Client account number.',
    example: '12341234',
  })
  clientAccountNumber: string;

  @ApiProperty({
    description: 'Client document.',
    example: '12345678910',
  })
  clientDocument: string;

  @ApiProperty({
    description: 'Client name.',
  })
  clientName: string;

  @ApiProperty({
    description: 'Client key.',
    example: 'bdb98227-3e02-4fa2-8e71-bfb8e4b4310a',
  })
  clientKey: string;

  @ApiProperty({
    description: 'Third part ispb.',
    example: '11111111',
  })
  @Transform((params) => formatIspb(params.value))
  thirdPartIspb: string;

  @ApiProperty({
    description: 'Third part branch.',
    example: '1234',
  })
  @Transform((params) => formatBranch(params.value))
  thirdPartBranch: string;

  @ApiProperty({
    description: 'Third part account type.',
    enum: AccountType,
    example: AccountType.CACC,
  })
  thirdPartAccountType: AccountType;

  @ApiProperty({
    description: 'Third part account number.',
    example: '12341234',
  })
  thirdPartAccountNumber: string;

  @ApiProperty({
    description: 'Third part document.',
    example: '12341234212',
  })
  thirdPartDocument: string;

  @ApiProperty({
    description: 'Third part name.',
  })
  thirdPartName: string;

  @ApiProperty({
    description: 'Third part key.',
    example: 'bdb98227-3e02-4fa2-8e71-bfb8e4b4310a',
  })
  thirdPartKey: string;

  @ApiProperty({
    description: 'Transaction endToEndId.',
    example: 'E12345678202202221158A2202221158',
  })
  endToEndId: string;

  @ApiProperty({
    description: 'Payment description.',
  })
  @SanitizeHtml()
  description: string;
}

/**
 * Notify completion controller.
 */
@ApiBearerAuth()
@ApiTags('Pix | Payments')
@Controller('notify-completion')
export class NotifyCompletionRestController {
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
      context: NotifyCompletionRestController.name,
    });
  }

  /**
   * Create notifyCompletion endpoint.
   */
  @ApiOperation({
    description: 'Notify completion.',
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
    @Body() data: NotifyCompletionBody,
    @RequestId() requestId: string,
  ): Promise<void> {
    const logger = this.logger.child({ loggerId: requestId });

    // Create a payload.
    const payload = new NotifyCompletionEntity(data);
    logger.debug('Notify completion in topazio.', { payload });

    // Call create pixKey service.
    await this.service.notifyCompletion(requestId, payload);

    logger.debug('Notify created and event emmited.');
  }
}
