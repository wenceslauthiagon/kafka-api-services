import { Controller, Body, Post, Version } from '@nestjs/common';
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
  IsString,
  IsOptional,
  IsInt,
  IsPositive,
  MaxLength,
  IsEnum,
  IsNumberString,
  Length,
} from 'class-validator';
import {
  DefaultApiHeaders,
  EnableReplayProtection,
  HasPermission,
  IsCpfOrCnpj,
  IsIsoStringDateFormat,
  KafkaServiceParam,
  LoggerParam,
  RequestTransactionId,
  SanitizeHtml,
  TransactionApiHeader,
  getMoment,
} from '@zro/common';
import { AuthUser, PersonType } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { AuthWallet } from '@zro/operations/domain';
import {
  AuthWalletParam,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import { AccountType, PaymentState } from '@zro/pix-payments/domain';
import { CreateByAccountAndDecodedPaymentServiceKafka } from '@zro/pix-payments/infrastructure';
import {
  CreateByAccountAndDecodedPaymentRequest,
  CreateByAccountAndDecodedPaymentResponse,
} from '@zro/pix-payments/interface';

class V2PaymentByAccountBody {
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
  @Length(4, 255)
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

  @ApiProperty({
    description: 'Value in R$ cents.',
    example: 1299,
  })
  @IsInt()
  @IsPositive()
  value!: number;

  @ApiPropertyOptional({
    description: 'Payment date.',
    format: 'YYYY-MM-DD',
    example: getMoment().format('YYYY-MM-DD'),
    required: false,
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD')
  payment_date?: Date;

  @ApiPropertyOptional({
    description: 'User defined payment description.',
    example: 'User defined description',
    required: false,
  })
  @IsOptional()
  @IsString()
  @SanitizeHtml()
  @MaxLength(140)
  description?: string;
}

class V2CreateByAccountPaymentRestResponse {
  @ApiProperty({
    description: 'Payment UUID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiPropertyOptional({
    description:
      'Operation UUID. Used to get receipt and track the transaction. This will not be returned if the payment has been scheduled.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
    required: false,
  })
  operation_id?: string;

  @ApiProperty({
    enum: PaymentState,
    description: 'Payment state.',
    example: PaymentState.PENDING,
  })
  state!: PaymentState;

  @ApiProperty({
    description: 'Value in R$ cents.',
    example: 1299,
  })
  value!: number;

  @ApiPropertyOptional({
    description:
      'Schedule a day to execute payment. Use null to send payment right now.',
    example: null,
    required: false,
    nullable: true,
  })
  payment_date?: Date;

  @ApiPropertyOptional({
    description: 'User defined payment description.',
    required: false,
    nullable: true,
  })
  description?: string;

  @ApiProperty({
    description: 'Payment created date.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: CreateByAccountAndDecodedPaymentResponse) {
    this.id = props.id;
    this.operation_id = props.operationId;
    this.state = props.state;
    this.value = props.value;
    this.payment_date = props.paymentDate;
    this.description = props.description;
    this.created_at = props.createdAt;
  }
}

/**
 * User pix payments controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Payments')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@TransactionApiHeader()
@EnableReplayProtection()
@Controller('pix/payments/by-account/instant-billing')
@HasPermission('api-paas-post-pix-payments-by-account-instant-billing')
export class V2CreateByAccountPaymentRestController {
  /**
   * send payment endpoint.
   */
  @ApiOperation({
    summary: 'Create new pix payment by bank account.',
    description: 'Create new pix payment by bank account.',
  })
  @ApiCreatedResponse({
    description: 'Payment accomplished.',
    type: V2CreateByAccountPaymentRestResponse,
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
  @Version('2')
  @Post()
  async execute(
    @AuthUserParam() user: AuthUser,
    @AuthWalletParam() wallet: AuthWallet,
    @Body() body: V2PaymentByAccountBody,
    @KafkaServiceParam(CreateByAccountAndDecodedPaymentServiceKafka)
    service: CreateByAccountAndDecodedPaymentServiceKafka,
    @LoggerParam(V2CreateByAccountPaymentRestController)
    logger: Logger,
    @RequestTransactionId() transactionId: string,
  ): Promise<V2CreateByAccountPaymentRestResponse> {
    // Send a payload.
    const payload: CreateByAccountAndDecodedPaymentRequest = {
      id: transactionId,
      personType: body.person_type,
      document: body.document,
      bankIspb: body.bank_ispb,
      branch: body.branch,
      accountNumber: body.account_number,
      accountType: body.account_type,
      userId: user.uuid,
      walletId: wallet.id,
      paymentDate: body.payment_date,
      value: body.value,
      description: body.description,
    };

    logger.debug('Send payment and decoded.', { user, payload });

    // Call send payment service.
    const result = await service.execute(payload);

    logger.debug('Payment and decoded sent.', { result });

    const response = new V2CreateByAccountPaymentRestResponse(result);

    return response;
  }
}
