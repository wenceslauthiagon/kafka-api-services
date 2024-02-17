import {
  Controller,
  Body,
  Post,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { Transform } from 'class-transformer';
import { Logger } from 'winston';
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
  formatValueFromFloatToInt,
  InjectLogger,
  KafkaServiceParam,
  RequestId,
} from '@zro/common';
import { AccountType } from '@zro/pix-payments/domain';
import { NotifyConfirmBankingTedEntity } from '@zro/api-topazio/domain';
import { TopazioServiceKafka } from '@zro/api-topazio/infrastructure';
import { ConfirmBankingTedServiceKafka } from '@zro/banking/infrastructure';
import { ConfirmBankingTedRequest } from '@zro/banking/interface';

export class NotifyConfirmBankingTedHeaders {
  @ApiProperty({
    description: 'Transaction unique id.',
    example: 'fb96cf13-4600-4d21-ad67-40fc05ac3a8d',
  })
  'transaction-id': string;
}

export class NotifyConfirmBankingTedRecipientBody {
  @ApiProperty({
    description: 'Receipt document BankingTed.',
    example: '90933356005',
  })
  document: string;

  @ApiProperty({
    description: 'BankingTed receipt bank code.',
    example: '237',
  })
  bankCode: string;

  @ApiProperty({
    description: 'BankingTed receipt branch.',
    example: '0001',
  })
  branch: string;

  @ApiProperty({
    description: 'BankingTed receipt accountNumber.',
    example: '111111',
  })
  accountNumber: string;

  @ApiProperty({
    description: 'BankingTed receipt accountType.',
    example: AccountType.CC,
    enum: AccountType,
  })
  accountType: AccountType;
}

export class NotifyConfirmBankingTedBody {
  @ApiProperty({ type: NotifyConfirmBankingTedRecipientBody })
  recipient: NotifyConfirmBankingTedRecipientBody;

  @ApiProperty({
    description: 'BankingTed receipt value.',
    example: 10000,
  })
  @Transform((params) => formatValueFromFloatToInt(params.value))
  value: number;
}

/**
 * Notify confirm banking ted controller.
 */
@ApiBearerAuth()
@ApiTags('Banking | TED')
@Controller('notify-confirmation/banking/ted')
export class NotifyConfirmBankingTedRestController {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param service topazio service.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly topazioService: TopazioServiceKafka,
  ) {
    this.logger = logger.child({
      context: NotifyConfirmBankingTedRestController.name,
    });
  }

  /**
   * Create notifyConfirm banking ted endpoint.
   */
  @ApiOperation({
    description: 'Notify confirm banking ted.',
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
    @Body() data: NotifyConfirmBankingTedBody,
    @Headers() headers: NotifyConfirmBankingTedHeaders,
    @RequestId() requestId: string,
    @KafkaServiceParam(ConfirmBankingTedServiceKafka)
    service: ConfirmBankingTedServiceKafka,
  ): Promise<void> {
    const logger = this.logger.child({ loggerId: requestId });

    // Create a payload.
    const payload = new NotifyConfirmBankingTedEntity({
      transactionId: headers['transaction-id'],
      document: data.recipient.document,
      bankCode: data.recipient.bankCode,
      branch: data.recipient.branch,
      accountNumber: data.recipient.accountNumber,
      accountType: data.recipient.accountType,
      value: data.value,
    });
    logger.debug('Notify confirm banking ted in topazio.', { payload });

    // Async all confirm in topazio for register callback.
    await this.topazioService.notifyConfirmBankingTed(requestId, payload);

    // Send a payload.
    const payloadBanking: ConfirmBankingTedRequest = {
      transactionId: headers['transaction-id'],
      beneficiaryDocument: data.recipient.document,
      beneficiaryBankCode: data.recipient.bankCode,
      beneficiaryAgency: data.recipient.branch,
      beneficiaryAccount: data.recipient.accountNumber,
      beneficiaryAccountType: data.recipient.accountType,
      amount: data.value,
    };

    // Sync call confirm in banking for execute function
    await service.execute(payloadBanking);

    logger.debug('Notify banking ted created and event emmited.');
  }
}
