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
  IsUUID,
  IsOptional,
  Length,
  IsEnum,
  IsNumberString,
  IsNotEmpty,
  MaxLength,
  IsString,
} from 'class-validator';
import {
  IsCpfOrCnpj,
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
  HasPermission,
  RequestTransactionId,
  TransactionApiHeader,
} from '@zro/common';
import { AuthUser, PersonType } from '@zro/users/domain';
import { AccountType } from '@zro/pix-payments/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { CreateDecodedPixAccountServiceKafka } from '@zro/pix-payments/infrastructure';
import {
  CreateDecodedPixAccountRequest,
  CreateDecodedPixAccountResponse,
} from '@zro/pix-payments/interface';

export class CreateDecodedPixAccountBody {
  @ApiProperty({
    enum: PersonType,
    description: `Person type:<br>
      <ul>
        <li>${PersonType.NATURAL_PERSON}.
        <li>${PersonType.LEGAL_PERSON}.
      </ul>`,
    example: PersonType.NATURAL_PERSON,
    required: false,
  })
  @IsEnum(PersonType)
  person_type: PersonType;

  @ApiProperty({
    description: "Person's document (CPF or CNPJ).",
    example: '00000000000',
  })
  @IsNumberString()
  @IsCpfOrCnpj()
  document: string;

  @ApiProperty({
    description: 'Bank ISPB code (8-digits)',
    required: false,
  })
  @IsString()
  @Length(8, 8)
  bank_ispb: string;

  @ApiProperty({
    description: 'Account branch (4-digits).',
    required: false,
  })
  @IsString()
  @Length(4, 4)
  branch: string;

  @ApiProperty({
    description: 'Account number (min 4-digits).',
    required: false,
  })
  @IsString()
  @MaxLength(255)
  account_number: string;

  @ApiProperty({
    enum: AccountType,
    description: `Account type:<br>
      <ul>
        <li>${AccountType.CACC}: Checking account.
        <li>${AccountType.SLRY}: Salary.
        <li>${AccountType.SVGS}: Savings.
      </ul>`,
    example: AccountType.CACC,
    required: false,
  })
  @IsEnum(AccountType)
  account_type: AccountType;
}

export class CreateDecodedPixAccountRestResponse {
  @ApiProperty({
    description: 'Pix decoded account ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  id: string;

  @ApiProperty({
    description: 'Person full name or company tax name.',
    example: 'Zro Pagamentos S.A.',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Company trade name.',
    example: 'Zrobank',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  trade_name?: string;

  constructor(props: CreateDecodedPixAccountResponse) {
    this.id = props.id;
    this.name = props.name;
    this.trade_name = props.tradeName;
  }
}

/**
 * User pix decode account controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Payments')
@ApiBearerAuth()
@DefaultApiHeaders()
@TransactionApiHeader()
@Controller('pix/payments/decode/by-account')
@HasPermission('api-users-post-pix-payments-decode-by-account')
export class CreateDecodedPixAccountRestController {
  /**
   * create decode account endpoint.
   */
  @ApiOperation({
    summary: 'Create new Decoded Pix Account ID.',
    description:
      "To create a new pix payment by a bank account, first you need to create a Decoded Pix Account ID. Enter the bank account's information on the requisition body below and execute to get its ID. This ID is the decoded_pix_account_id which will be required to create a pix payment by a bank account.",
  })
  @ApiCreatedResponse({
    description: 'Decoded account returned successfully.',
    type: CreateDecodedPixAccountRestResponse,
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
    @KafkaServiceParam(CreateDecodedPixAccountServiceKafka)
    createService: CreateDecodedPixAccountServiceKafka,
    @LoggerParam(CreateDecodedPixAccountRestController)
    logger: Logger,
    @RequestTransactionId() transactionId: string,
    @Body() body: CreateDecodedPixAccountBody,
  ): Promise<CreateDecodedPixAccountRestResponse> {
    // Create a payload.
    const payload: CreateDecodedPixAccountRequest = {
      id: transactionId,
      userId: user.uuid,
      personType: body.person_type,
      document: body.document,
      bankIspb: body.bank_ispb,
      branch: body.branch,
      accountNumber: body.account_number,
      accountType: body.account_type,
    };

    logger.debug('Create decode account.', { user, payload });

    // Call create decode account service.
    const result = await createService.execute(payload);

    logger.debug('Decode account created.', result);

    const response = result && new CreateDecodedPixAccountRestResponse(result);

    return response;
  }
}
