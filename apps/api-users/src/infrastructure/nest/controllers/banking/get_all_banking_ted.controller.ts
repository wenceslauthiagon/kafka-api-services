import { Controller, Get, Query } from '@nestjs/common';
import { Logger } from 'winston';
import { IsEnum, IsNumberString, IsOptional, IsUUID } from 'class-validator';
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
  cnpjMask,
  cpfMask,
  isCnpj,
  IsCpfOrCnpj,
  IsDateAfterThan,
  IsDateBeforeThan,
  IsIsoStringDateFormat,
  KafkaServiceParam,
  LoggerParam,
  PaginationParams,
  PaginationRestResponse,
  PaginationSort,
  Sort,
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AccountType } from '@zro/pix-payments/domain';
import { BankingTedState } from '@zro/banking/domain';
import {
  GetAllBankingTedRequest,
  GetAllBankingTedRequestSort,
  GetAllBankingTedResponse,
  GetAllBankingTedResponseItem,
} from '@zro/banking/interface';
import { GetAllBankingTedServiceKafka } from '@zro/banking/infrastructure';
import { AuthUserParam } from '@zro/users/infrastructure';

class GetAllBankingTedParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllBankingTedRequestSort,
  })
  @IsOptional()
  @Sort(GetAllBankingTedRequestSort)
  sort?: PaginationSort;

  @ApiPropertyOptional({
    description: 'BankingTed operation created.',
  })
  @IsOptional()
  @IsUUID(4)
  operation_id: string;

  @ApiPropertyOptional({
    description: 'BankingTed state.',
    enum: BankingTedState,
  })
  @IsEnum(BankingTedState)
  @IsOptional()
  state?: BankingTedState;

  @ApiPropertyOptional({
    description: 'BankingTed beneficiary document.',
  })
  @IsOptional()
  @IsNumberString()
  @IsCpfOrCnpj()
  beneficiary_document?: string;

  @ApiPropertyOptional({
    description: 'Created at start for any bankingTed.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD')
  @IsDateBeforeThan('created_at_end', false)
  created_at_start?: Date;

  @ApiPropertyOptional({
    description: 'Created at end for any bankingTed.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD')
  @IsDateAfterThan('created_at_start', false)
  created_at_end?: Date;

  @ApiPropertyOptional({
    description: 'Confirmed at start for any bankingTed.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD')
  @IsDateBeforeThan('confirmed_at_end', false)
  confirmed_at_start?: Date;

  @ApiPropertyOptional({
    description: 'Confirmed at end for any bankingTed.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD')
  @IsDateAfterThan('confirmed_at_start', false)
  confirmed_at_end?: Date;

  @ApiPropertyOptional({
    description: 'Failed at start for any bankingTed.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD')
  @IsDateBeforeThan('failed_at_end', false)
  failed_at_start?: Date;

  @ApiPropertyOptional({
    description: 'Failed at end for any bankingTed.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD')
  @IsDateAfterThan('failed_at_start', false)
  failed_at_end?: Date;
}

class GetAllBankingTedRestResponseItem {
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

  constructor(props: GetAllBankingTedResponseItem) {
    this.id = props.id;
    this.amount = props.amount;
    this.state = props.state;
    this.operation_id = props.operationId;
    this.beneficiary_bank_name = props.beneficiaryBankName;
    this.beneficiary_bank_code = props.beneficiaryBankCode;
    this.beneficiary_name = props.beneficiaryName;
    this.beneficiary_type = props.beneficiaryType;
    this.beneficiary_document = isCnpj(props.beneficiaryDocument)
      ? cnpjMask(props.beneficiaryDocument)
      : cpfMask(props.beneficiaryDocument);
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

class GetAllBankingTedRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'bankingTeds data.',
    type: [GetAllBankingTedRestResponseItem],
  })
  data!: GetAllBankingTedRestResponseItem[];

  constructor(props: GetAllBankingTedResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllBankingTedRestResponseItem(item),
    );
  }
}

/**
 * User banking controller. Controller is protected by JWT access token.
 */
@ApiTags('Banking')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('banking/ted')
@HasPermission('api-users-get-banking-ted')
export class GetAllBankingTedRestController {
  /**
   * get all bankingTed endpoint.
   */
  @ApiOperation({
    summary: 'Get a BankingTed status.',
  })
  @ApiOkResponse({
    description: 'BankingTed received.',
    type: GetAllBankingTedRestResponse,
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
    @KafkaServiceParam(GetAllBankingTedServiceKafka)
    service: GetAllBankingTedServiceKafka,
    @LoggerParam(GetAllBankingTedRestController)
    logger: Logger,
    @Query() query: GetAllBankingTedParams,
  ): Promise<GetAllBankingTedRestResponse> {
    // GetAll payload.
    const payload: GetAllBankingTedRequest = {
      // BankingTed query
      userId: user.uuid,
      operationId: query.operation_id,
      state: query.state,
      beneficiaryDocument: query.beneficiary_document,
      createdAtStart: query.created_at_start,
      createdAtEnd: query.created_at_end,
      confirmedAtStart: query.confirmed_at_start,
      confirmedAtEnd: query.confirmed_at_end,
      failedAtStart: query.failed_at_start,
      failedAtEnd: query.failed_at_end,
      // Sort query
      page: query.page,
      pageSize: query.size,
      sort: query.sort,
      order: query.order,
    };

    logger.debug('Get all BankingTeds.', { user, payload });

    // Call get BankingTeds service.
    const result = await service.execute(payload);

    logger.debug('BankingTeds result.', { result });

    const response = result && new GetAllBankingTedRestResponse(result);

    return response;
  }
}
