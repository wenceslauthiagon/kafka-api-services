import { Controller, Param, Get } from '@nestjs/common';
import { Logger } from 'winston';
import { IsInt, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  cpfMask,
  DefaultApiHeaders,
  HasPermission,
  isCpf,
  KafkaServiceParam,
  LoggerParam,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { BankingTedState } from '@zro/banking/domain';
import { AccountType } from '@zro/pix-payments/domain';
import {
  GetBankingTedByIdRequest,
  GetBankingTedByIdResponse,
} from '@zro/banking/interface';
import { GetBankingTedByIdServiceKafka } from '@zro/banking/infrastructure';
import { AuthUserParam } from '@zro/users/infrastructure';

export class GetBankingTedByIdParams {
  @ApiProperty({
    description: 'BankingTed ID.',
    example: 4598,
  })
  @IsPositive()
  @IsInt()
  @Transform((params) => params && parseInt(params.value))
  id!: number;
}

export class GetBankingTedByIdRestResponse {
  @ApiProperty({
    description: 'BankingTed ID.',
    example: 4598,
  })
  id: number;

  @ApiPropertyOptional({
    description: 'BankingTed state.',
    enum: BankingTedState,
    example: BankingTedState.CONFIRMED,
  })
  state?: BankingTedState;

  @ApiPropertyOptional({
    description: 'BankingTed amount.',
    example: 15050,
  })
  amount?: number;

  @ApiProperty({
    description: 'BankingTed operation created.',
    example: '1b43322e-d6d5-4895-ac3f-a440cc63816a',
  })
  operation_id: string;

  @ApiPropertyOptional({
    description: 'BankingTed beneficiary bank name.',
    example: 'Banco Bradesco S.A.',
  })
  beneficiary_bank_name?: string;

  @ApiPropertyOptional({
    description: 'BankingTed beneficiary bank id.',
    example: '237',
  })
  beneficiary_bank_code?: string;

  @ApiProperty({
    description: 'BankingTed beneficiary name.',
    example: 'Name Test',
  })
  beneficiary_name: string;

  @ApiProperty({
    description: 'BankingTed beneficiary type.',
    example: 'fisico',
  })
  beneficiary_type: string;

  @ApiProperty({
    description: 'BankingTed beneficiary document.',
    example: '99999999910',
  })
  beneficiary_document: string;

  @ApiProperty({
    description: 'BankingTed beneficiary agency.',
    example: '0001',
  })
  beneficiary_agency: string;

  @ApiProperty({
    description: 'BankingTed beneficiary account.',
    example: '111111',
  })
  beneficiary_account: string;

  @ApiProperty({
    description: 'BankingTed beneficiary account digit.',
    example: '10',
  })
  beneficiary_account_digit: string;

  @ApiProperty({
    description: 'BankingTed beneficiary account type.',
    example: 'cc',
    enum: AccountType,
  })
  beneficiary_account_type: AccountType;

  @ApiPropertyOptional({
    description: 'BankingTed transaction gateway ID.',
    example: '1b43322e-d6d5-4895-ac3f-a440cc63816a',
  })
  transaction_id?: string;

  @ApiPropertyOptional({
    description: 'BankingTed confirmed date.',
    example: new Date(),
  })
  confirmed_at?: Date;

  @ApiPropertyOptional({
    description: 'BankingTed failed date.',
    example: new Date(),
  })
  failed_at?: Date;

  @ApiPropertyOptional({
    description: 'BankingTed created date.',
    example: new Date(),
  })
  created_at?: Date;

  constructor(props: GetBankingTedByIdResponse) {
    this.id = props.id;
    this.amount = props.amount;
    this.state = props.state;
    this.operation_id = props.operationId;
    this.beneficiary_bank_name = props.beneficiaryBankName;
    this.beneficiary_bank_code = props.beneficiaryBankCode;
    this.beneficiary_name = props.beneficiaryName;
    this.beneficiary_type = props.beneficiaryType;
    this.beneficiary_document = isCpf(props.beneficiaryDocument)
      ? cpfMask(props.beneficiaryDocument)
      : props.beneficiaryDocument;
    this.beneficiary_agency = props.beneficiaryAgency;
    this.beneficiary_account = props.beneficiaryAccount;
    this.beneficiary_account_digit = props.beneficiaryAccountDigit;
    this.beneficiary_account_type = props.beneficiaryAccountType;
    this.transaction_id = props.transactionId;
    this.confirmed_at = props.confirmedAt;
    this.failed_at = props.failedAt;
    this.created_at = props.createdAt;
  }
}

/**
 * User banking controller. Controller is protected by JWT access token.
 */
@ApiTags('Banking')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('banking/ted/:id')
@HasPermission('api-paas-get-banking-ted-by-id')
export class GetBankingTedByIdRestController {
  /**
   * get by id bankingTed endpoint.
   */
  @ApiOperation({
    summary: 'Get TED operation by ID.',
    description:
      "Enter the TED operation's ID below and execute to get its state and all information.",
  })
  @ApiOkResponse({
    description: 'BankingTed received.',
    type: GetBankingTedByIdRestResponse,
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
  @Get()
  async execute(
    @AuthUserParam() user: AuthUser,
    @Param() params: GetBankingTedByIdParams,
    @KafkaServiceParam(GetBankingTedByIdServiceKafka)
    service: GetBankingTedByIdServiceKafka,
    @LoggerParam(GetBankingTedByIdRestController)
    logger: Logger,
  ): Promise<GetBankingTedByIdRestResponse> {
    // Create a payload.
    const payload: GetBankingTedByIdRequest = {
      id: params.id,
    };

    logger.debug('Get By id BankingTed.', { user, payload });

    // Call get BankingTed service.
    const result = await service.execute(payload);

    logger.debug('BankingTed result.', { result });

    const response = result && new GetBankingTedByIdRestResponse(result);

    return response;
  }
}
