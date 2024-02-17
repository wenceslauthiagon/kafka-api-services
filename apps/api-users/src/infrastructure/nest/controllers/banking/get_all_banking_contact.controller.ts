import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import {
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
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
  KafkaServiceParam,
  LoggerParam,
  PaginationParams,
  PaginationRestResponse,
  PaginationSort,
  Sort,
  DefaultApiHeaders,
  HasPermission,
  IsIsoStringDateFormat,
  IsDateBeforeThan,
  IsDateAfterThan,
  IsCpfOrCnpj,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import {
  GetAllBankingContactResponseItem,
  GetAllBankingAccountContactResponseItem,
  GetAllBankingContactResponse,
  GetAllBankingContactRequest,
  GetAllBankingContactRequestSort,
} from '@zro/banking/interface';
import { AuthUserParam } from '@zro/users/infrastructure';
import { GetAllBankingContactServiceKafka } from '@zro/banking/infrastructure';

class GetAllBankingContactParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllBankingContactRequestSort,
  })
  @IsOptional()
  @Sort(GetAllBankingContactRequestSort)
  sort?: PaginationSort;

  @ApiPropertyOptional({
    description: 'Contact name.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Contact document.',
  })
  @IsOptional()
  @IsNumberString()
  @IsCpfOrCnpj()
  document?: string;

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
}

class GetAllBankingAccountContactRestResponseItem {
  @ApiProperty({
    description: 'Contact Account Contact ID.',
  })
  id: number;

  @ApiProperty({
    description: 'Contact bank name.',
  })
  bank_name: string;

  @ApiProperty({
    description: 'Contact bank code.',
  })
  bank_code: string;

  @ApiProperty({
    description: 'Contact branch number.',
  })
  branch_number: string;

  @ApiProperty({
    description: 'Contact account number.',
  })
  account_number: string;

  @ApiProperty({
    description: 'Contact account digit.',
  })
  account_digit: string;

  @ApiProperty({
    description: 'Contact account type.',
  })
  account_type: string;

  @ApiProperty({
    description: 'Banking contact created at.',
    example: new Date(),
  })
  created_at: Date;

  constructor(props: GetAllBankingAccountContactResponseItem) {
    this.id = props.id;
    this.account_digit = props.accountDigit;
    this.account_number = props.accountNumber;
    this.account_type = props.accountType;
    this.bank_code = props.bankCode;
    this.bank_name = props.bankName;
    this.branch_number = props.branchNumber;
    this.created_at = props.createdAt;
  }
}

class GetAllBankingContactRestResponseItem {
  @ApiProperty({
    description: 'Banking contact ID.',
    example: '1',
  })
  id: number;

  @ApiProperty({
    description: 'Banking contact name.',
    example: 'Joao da Silva',
  })
  name: string;

  @ApiProperty({
    description: 'Banking contact document.',
    example: '10134255587',
  })
  document: string;

  @ApiProperty({
    description: 'Banking contact document type.',
    example: 'CPF',
  })
  document_type: string;

  @ApiProperty({
    description: 'Banking account contacts.',
    type: [GetAllBankingAccountContactRestResponseItem],
    example: [],
  })
  accounts: GetAllBankingAccountContactRestResponseItem[];

  @ApiProperty({
    description: 'Banking contact created at.',
    example: new Date(),
  })
  created_at: Date;

  constructor(props: GetAllBankingContactResponseItem) {
    this.id = props.id;
    this.name = props.name;
    this.document = props.document;
    this.document_type = props.documentType;
    this.created_at = props.createdAt;

    if (props.accounts) {
      this.accounts = props.accounts.map(
        (account) => new GetAllBankingAccountContactRestResponseItem(account),
      );
    }
  }
}

class GetAllBankingContactRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'BankingContacts data.',
    type: [GetAllBankingContactRestResponseItem],
  })
  data: GetAllBankingContactRestResponseItem[];

  constructor(props: GetAllBankingContactResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllBankingContactRestResponseItem(item),
    );
  }
}

/**
 * BankingContacts controller. Controller is protected by JWT access token.
 */
@ApiTags('Banking')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('/banking/contacts')
@HasPermission('api-users-get-all-banking-contact')
export class GetAllBankingContactRestController {
  /**
   * get bank endpoint.
   */
  @ApiOperation({
    summary: 'List the banking contacts.',
    description: 'List the banking contacts.',
  })
  @ApiOkResponse({
    description: 'The banking contacts  returned successfully.',
    type: GetAllBankingContactRestResponse,
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
    @KafkaServiceParam(GetAllBankingContactServiceKafka)
    service: GetAllBankingContactServiceKafka,
    @LoggerParam(GetAllBankingContactRestController)
    logger: Logger,
    @Query() params: GetAllBankingContactParams,
  ): Promise<GetAllBankingContactRestResponse> {
    // GetAll a payload.
    const payload: GetAllBankingContactRequest = {
      userId: user.id,
      name: params.name,
      document: params.document,
      createdAtStart: params.created_at_start,
      createdAtEnd: params.created_at_end,
      sort: params.sort,
      order: params.order,
    };

    logger.debug('GetAll banking contacts.', { user, payload });

    // Call get banking contacts service.
    const result = await service.execute(payload);

    logger.debug('BankingContacts found.', { result });

    const response = new GetAllBankingContactRestResponse(result);

    return response;
  }
}
