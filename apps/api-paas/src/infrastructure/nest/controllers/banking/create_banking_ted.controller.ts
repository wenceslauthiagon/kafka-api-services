import { Controller, Body, Post } from '@nestjs/common';
import { Logger } from 'winston';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  DefaultApiHeaders,
  EnableReplayProtection,
  HasPermission,
  KafkaServiceParam,
  LoggerParam,
  RequestTransactionId,
  TransactionApiHeader,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthWallet } from '@zro/operations/domain';
import { AccountType } from '@zro/pix-payments/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { AuthWalletParam } from '@zro/operations/infrastructure';
import { CreateBankingTedServiceKafka } from '@zro/banking/infrastructure';
import {
  CreateBankingTedRequest,
  CreateBankingTedResponse,
} from '@zro/banking/interface';

class CreateBankingTedBody {
  @ApiProperty({
    description: 'BankingTed amount.',
    example: 10000,
  })
  @IsPositive()
  @IsInt()
  amount: number;

  @ApiPropertyOptional({
    description: 'BankingTed beneficiary bank name.',
    example: 'Banco Bradesco S.A.',
  })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  beneficiary_bank_name?: string;

  @ApiPropertyOptional({
    description: 'BankingTed beneficiary bank code.',
    example: '237',
  })
  @IsString()
  @MaxLength(255)
  beneficiary_bank_code: string;

  @ApiProperty({
    description: 'BankingTed beneficiary name.',
    example: 'Name Test',
  })
  @IsString()
  @MaxLength(255)
  beneficiary_name: string;

  @ApiProperty({
    description: 'BankingTed beneficiary type.',
    example: 'fisico',
  })
  @IsString()
  @MaxLength(255)
  beneficiary_type: string;

  @ApiProperty({
    description: 'BankingTed beneficiary document.',
    example: '90933356005',
  })
  @IsString()
  @MaxLength(255)
  beneficiary_document: string;

  @ApiProperty({
    description: 'BankingTed beneficiary agency.',
    example: '0001',
  })
  @IsString()
  @MaxLength(255)
  beneficiary_agency: string;

  @ApiProperty({
    description: 'BankingTed beneficiary account.',
    example: '111111',
  })
  @IsString()
  @MaxLength(255)
  beneficiary_account: string;

  @ApiProperty({
    description: 'BankingTed beneficiary account digit.',
    example: '10',
  })
  @IsString()
  @MaxLength(255)
  beneficiary_account_digit: string;

  @ApiProperty({
    description: 'BankingTed beneficiary account type.',
    example: AccountType.CC,
    enum: AccountType,
  })
  @IsEnum(AccountType)
  beneficiary_account_type: AccountType;
}

class CreateBankingTedRestResponse {
  @ApiProperty({
    description: 'BankingTed ID.',
    example: 6790,
  })
  id!: number;

  @ApiProperty({
    description: 'Operation ID bankingTed.',
    example: '295564a9-c5fd-4e73-9abb-72e0383f2dfb',
  })
  operation_id!: string;

  @ApiProperty({
    description: 'BankingTed Created at.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: CreateBankingTedResponse) {
    this.id = props.id;
    this.operation_id = props.operationId;
    this.created_at = props.createdAt;
  }
}

/**
 * User banking controller. Controller is protected by JWT access token.
 */
@ApiTags('Banking')
@ApiBearerAuth()
@DefaultApiHeaders()
@TransactionApiHeader()
@EnableReplayProtection()
@Controller('banking/ted')
@HasPermission('api-paas-post-banking-ted')
export class CreateBankingTedRestController {
  /**
   * Create bankingTed endpoint.
   */
  @ApiOperation({
    summary: 'Create new TED operation.',
    description:
      "Enter the TED operation's information on the requisition body below and execute.",
  })
  @ApiCreatedResponse({
    description: 'BankingTeds created.',
    type: CreateBankingTedRestResponse,
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
  @Post()
  async execute(
    @AuthUserParam() user: AuthUser,
    @AuthWalletParam() wallet: AuthWallet,
    @Body() body: CreateBankingTedBody,
    @KafkaServiceParam(CreateBankingTedServiceKafka)
    service: CreateBankingTedServiceKafka,
    @LoggerParam(CreateBankingTedRestController)
    logger: Logger,
    @RequestTransactionId() transactionId: string,
  ): Promise<CreateBankingTedRestResponse> {
    // Send a payload.
    const payload: CreateBankingTedRequest = {
      operationId: transactionId,
      userId: user.uuid,
      walletId: wallet.id,
      amount: body.amount,
      beneficiaryBankCode: body.beneficiary_bank_code,
      beneficiaryBankName: body.beneficiary_bank_name,
      beneficiaryName: body.beneficiary_name,
      beneficiaryType: body.beneficiary_type,
      beneficiaryDocument: body.beneficiary_document,
      beneficiaryAgency: body.beneficiary_agency,
      beneficiaryAccount: body.beneficiary_account,
      beneficiaryAccountDigit: body.beneficiary_account_digit,
      beneficiaryAccountType: body.beneficiary_account_type,
    };

    logger.debug('Send create bankingTed.', { user, payload });

    // Call send create bankingTed service.
    const result = await service.execute(payload);

    logger.debug('bankingTed sent.', { result });

    const response = new CreateBankingTedRestResponse(result);

    return response;
  }
}
