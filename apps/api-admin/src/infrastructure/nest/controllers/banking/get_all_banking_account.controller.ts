import { Logger } from 'winston';
import { IsOptional, IsString, MaxLength } from 'class-validator';
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
import { Controller, Get, Query } from '@nestjs/common';
import {
  IsDateAfterThan,
  IsDateBeforeThan,
  IsIsoStringDateFormat,
  KafkaServiceParam,
  LoggerParam,
  PaginationParams,
  PaginationRestResponse,
  PaginationSort,
  Sort,
} from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import { AccountType } from '@zro/pix-payments/domain';
import {
  GetAllAdminBankingAccountResponseItem,
  GetAllAdminBankingAccountResponse,
  GetAllAdminBankingAccountRequest,
  GetAllAdminBankingAccountRequestSort,
} from '@zro/banking/interface';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';
import { GetAllAdminBankingAccountServiceKafka } from '@zro/banking/infrastructure';

export class GetAllBankingAccountParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllAdminBankingAccountRequestSort,
  })
  @IsOptional()
  @Sort(GetAllAdminBankingAccountRequestSort)
  sort?: PaginationSort;

  @ApiPropertyOptional({
    description: 'Account branch number.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  branch_number?: string;

  @ApiPropertyOptional({
    description: 'Account number.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  account_number?: string;

  @ApiPropertyOptional({
    description: 'Account digit.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  account_digit?: string;

  @ApiPropertyOptional({
    description: 'Account bank name.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bank_name?: string;

  @ApiPropertyOptional({
    description: 'Account bank code.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bank_code?: string;

  @ApiPropertyOptional({
    description: 'CreatedAt date start range.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtStart',
  })
  @IsDateBeforeThan('created_at_end', true, {
    message: 'createdAtStart must be before than createdAtEnd',
  })
  created_at_start?: Date;

  @ApiPropertyOptional({
    description: 'CreatedAt date end range.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtEnd',
  })
  @IsDateAfterThan('created_at_start', true, {
    message: 'createdAtEnd must be after than createdAtStart',
  })
  created_at_end?: Date;
}

class GetAllBankingAccountRestResponseItem {
  @ApiProperty({
    description: 'Acccount ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiProperty({
    description: 'Account user document.',
    example: '36565905000156',
  })
  document: string;

  @ApiProperty({
    description: 'Account user name.',
    example: 'Joao da Silva.',
  })
  full_name: string;

  @ApiProperty({
    description: 'Account branch number.',
    example: '0001',
  })
  branch_number: string;

  @ApiProperty({
    description: 'Account number.',
    example: '123456',
  })
  account_number: string;

  @ApiProperty({
    description: 'Account digit.',
    example: '0',
  })
  account_digit: string;

  @ApiProperty({
    description: 'Account type.',
    example: AccountType.CC,
  })
  account_type: AccountType;

  @ApiProperty({
    description: 'Account bank name.',
    example: 'Zro Bank',
  })
  bank_name: string;

  @ApiProperty({
    description: 'Account bank code.',
    example: '341',
  })
  bank_code: string;

  @ApiProperty({
    description: 'Account description.',
    example: 'Conta corrente',
  })
  description: string;

  @ApiProperty({
    description: 'Account enabled.',
    example: true,
  })
  enabled: boolean;

  @ApiProperty({
    description: 'Created by Admin ID.',
    example: 1,
  })
  created_by_admin_id: number;

  @ApiProperty({
    description: 'Updated by Admin ID.',
    example: 1,
  })
  updated_by_admin_id: number;

  @ApiPropertyOptional({
    description: 'Bank created at.',
    example: new Date(),
  })
  created_at?: Date;

  constructor(props: GetAllAdminBankingAccountResponseItem) {
    this.id = props.id;
    this.document = props.document;
    this.full_name = props.fullName;
    this.branch_number = props.branchNumber;
    this.account_number = props.accountNumber;
    this.account_digit = props.accountDigit;
    this.account_type = props.accountType;
    this.enabled = props.enabled;
    this.bank_name = props.bankName;
    this.bank_code = props.bankCode;
    this.description = props.description;
    this.enabled = props.enabled;
    this.created_by_admin_id = props.createdByAdminId;
    this.updated_by_admin_id = props.updatedByAdminId;
    this.created_at = props.createdAt;
  }
}

export class GetAllBankingAccountRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'Banking accounts data.',
    type: [GetAllBankingAccountRestResponseItem],
  })
  data!: GetAllBankingAccountRestResponseItem[];

  constructor(props: GetAllAdminBankingAccountResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllBankingAccountRestResponseItem(item),
    );
  }
}

/**
 * Banking Accounts controller. Controller is protected by JWT access token.
 */
@ApiTags('Banking')
@ApiBearerAuth()
@Controller('banking/accounts')
export class GetAllBankingAccountRestController {
  /**
   * get banking accounts endpoint.
   */
  @ApiOperation({
    summary: 'List the banking accounts.',
    description: 'List the banking accounts.',
  })
  @ApiOkResponse({
    description: 'The banking accounts returned successfully.',
    type: GetAllBankingAccountRestResponse,
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
    @AuthAdminParam() admin: AuthAdmin,
    @KafkaServiceParam(GetAllAdminBankingAccountServiceKafka)
    getAllService: GetAllAdminBankingAccountServiceKafka,
    @LoggerParam(GetAllBankingAccountRestController)
    logger: Logger,
    @Query() params: GetAllBankingAccountParams,
  ): Promise<GetAllBankingAccountRestResponse> {
    // GetAll a payload.
    const payload: GetAllAdminBankingAccountRequest = {
      page: params.page,
      pageSize: params.size,
      sort: params.sort,
      order: params.order,
      branchNumber: params.branch_number,
      accountNumber: params.account_number,
      accountDigit: params.account_digit,
      bankName: params.bank_name,
      bankCode: params.bank_code,
      createdAtStart: params.created_at_start,
      createdAtEnd: params.created_at_end,
    };

    logger.debug('GetAll banking accounts.', { admin, payload });

    // Call get banking accounts service.
    const result = await getAllService.execute(payload);

    logger.debug('Banking accounts found.', { result });

    const response = new GetAllBankingAccountRestResponse(result);

    return response;
  }
}
