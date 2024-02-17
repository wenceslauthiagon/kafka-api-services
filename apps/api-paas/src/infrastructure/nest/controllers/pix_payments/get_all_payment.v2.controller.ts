import { Logger } from 'winston';
import { Controller, Get, Query, Version } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
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
  IsDateAfterThan,
  IsDateBeforeThan,
  IsIsoStringDateFormat,
  cpfMask,
  HasPermission,
  DefaultApiHeaders,
} from '@zro/common';
import { PaymentState } from '@zro/pix-payments/domain';
import { PersonType, AuthUser } from '@zro/users/domain';
import {
  GetAllPaymentByWalletResponseItem,
  GetAllPaymentByWalletResponse,
  GetAllPaymentByWalletRequest,
  GetAllPaymentByWalletRequestSort,
} from '@zro/pix-payments/interface';
import { GetAllPaymentByWalletServiceKafka } from '@zro/pix-payments/infrastructure';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  AuthWalletParam,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import { AuthWallet } from '@zro/operations/domain';

export enum V2WebhookType {
  DEVOLUTION_COMPLETED = 'DEVOLUTION_COMPLETED',
  DEVOLUTION_RECEIVED = 'DEVOLUTION_RECEIVED',
  DEPOSIT_RECEIVED = 'DEPOSIT_RECEIVED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
}

class V2GetAllPaymentParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllPaymentByWalletRequestSort,
  })
  @IsOptional()
  @Sort(GetAllPaymentByWalletRequestSort)
  sort?: PaginationSort;

  @ApiPropertyOptional({
    enum: PaymentState,
    description: 'Payment State.',
    example: [PaymentState.SCHEDULED, PaymentState.CONFIRMED],
    isArray: true,
  })
  @Transform((params) => {
    if (!params.value) return null;
    return Array.isArray(params.value) ? params.value : [params.value];
  })
  @IsOptional()
  @IsEnum(PaymentState, { each: true })
  states?: PaymentState[];

  @ApiPropertyOptional({
    description: 'Transaction period date start for any transaction.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD')
  @IsDateBeforeThan('payment_date_period_end', false)
  payment_date_period_start?: Date;

  @ApiPropertyOptional({
    description: 'Transaction period date end for any transaction.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD')
  @IsDateAfterThan('payment_date_period_start', false)
  payment_date_period_end?: Date;

  @ApiPropertyOptional({
    description: 'Created at period date start for any transaction.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD')
  @IsDateBeforeThan('created_at_period_end', false)
  created_at_period_start?: Date;

  @ApiPropertyOptional({
    description: 'Created at period date end for any transaction.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD')
  @IsDateAfterThan('created_at_period_start', false)
  created_at_period_end?: Date;

  @ApiPropertyOptional({
    description: 'Payment end to end id',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  end_to_end_id?: string;

  @ApiPropertyOptional({
    description: 'Payment client document.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  client_document?: string;
}

class V2GetAllPaymentRestResponseItem {
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
    description: 'Transaction type.',
    enum: V2WebhookType,
  })
  type!: V2WebhookType;

  @ApiProperty({
    description: 'Payment state.',
    enum: PaymentState,
  })
  state: PaymentState;

  @ApiProperty({
    description: 'End to end id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  end_to_end_id!: string;

  @ApiPropertyOptional({
    description: 'Payment txid identifier.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
    required: false,
  })
  txid?: string;

  @ApiProperty({
    description: 'Value in R$ cents.',
    example: 1299,
  })
  amount!: number;

  @ApiPropertyOptional({
    description: 'The payment owner name.',
  })
  owner_name?: string;

  @ApiProperty({
    description: 'The payment owner person type.',
    enum: PersonType,
  })
  owner_person_type!: PersonType;

  @ApiPropertyOptional({
    description: 'The payment owner document.',
  })
  owner_document?: string;

  @ApiPropertyOptional({
    description: 'The payment owner account number.',
  })
  owner_account_number?: string;

  @ApiPropertyOptional({
    description: 'The payment owner branch.',
  })
  owner_branch?: string;

  @ApiProperty({
    description: 'The payment owner bank name.',
  })
  owner_bank_name!: string;

  @ApiPropertyOptional({
    description: 'The payment owner bank ispb.',
  })
  owner_bank_ispb!: string;

  @ApiPropertyOptional({
    description: 'The payment beneficiary name.',
  })
  beneficiary_name?: string;

  @ApiProperty({
    description: 'The payment beneficiary person type.',
    enum: PersonType,
  })
  beneficiary_person_type!: PersonType;

  @ApiPropertyOptional({
    description: 'The payment beneficiary document.',
  })
  beneficiary_document?: string;

  @ApiProperty({
    description: 'The payment beneficiary bank name.',
  })
  beneficiary_bank_name!: string;

  @ApiPropertyOptional({
    description: 'The payment beneficiary bank ispb.',
  })
  beneficiary_bank_ispb!: string;

  @ApiProperty({
    description: 'Date of created payment.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: GetAllPaymentByWalletResponseItem) {
    this.id = props.id;
    this.operation_id = props.operationId;
    this.type = V2WebhookType.PAYMENT_COMPLETED;
    this.state = props.state;
    this.end_to_end_id = props.endToEndId;
    this.txid = props.txId;
    this.amount = props.value;
    this.owner_name = props.ownerFullName;
    this.owner_person_type = props.ownerPersonType;
    this.owner_document =
      props.ownerPersonType === PersonType.NATURAL_PERSON
        ? cpfMask(props.ownerDocument)
        : props.ownerDocument;
    this.owner_account_number = props.ownerAccountNumber;
    this.owner_branch = props.ownerBranch;
    this.owner_bank_name = props.ownerBankName;
    this.owner_bank_ispb = props.ownerBankIspb;
    this.beneficiary_name = props.beneficiaryName;
    this.beneficiary_person_type = props.beneficiaryPersonType;
    this.beneficiary_document =
      props.beneficiaryPersonType === PersonType.NATURAL_PERSON
        ? cpfMask(props.beneficiaryDocument)
        : props.beneficiaryDocument;
    this.beneficiary_bank_name = props.beneficiaryBankName;
    this.beneficiary_bank_ispb = props.beneficiaryBankIspb;
    this.created_at = props.createdAt;
  }
}

class V2GetAllPaymentRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'Payments data.',
    type: [V2GetAllPaymentRestResponseItem],
  })
  data!: V2GetAllPaymentRestResponseItem[];

  constructor(props: GetAllPaymentByWalletResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new V2GetAllPaymentRestResponseItem(item),
    );
  }
}

/**
 * Payments controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Payments')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@Controller('pix/payments')
@HasPermission('api-paas-get-pix-payments')
export class V2GetAllPaymentRestController {
  /**
   * get payment endpoint.
   */
  @ApiOperation({
    deprecated: true,
    summary: "List user's payments.",
    description: "Get a list of user's payments.",
  })
  @ApiOkResponse({
    description: 'The payments returned successfully.',
    type: V2GetAllPaymentRestResponse,
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
  @Get()
  async execute(
    @AuthUserParam() user: AuthUser,
    @AuthWalletParam() wallet: AuthWallet,
    @Query() query: V2GetAllPaymentParams,
    @KafkaServiceParam(GetAllPaymentByWalletServiceKafka)
    getAllPaymentService: GetAllPaymentByWalletServiceKafka,
    @LoggerParam(V2GetAllPaymentRestController)
    logger: Logger,
  ): Promise<V2GetAllPaymentRestResponse> {
    // GetAll payload.
    const payload: GetAllPaymentByWalletRequest = {
      // Payment query
      states: query.states,
      userId: user.uuid,
      walletId: wallet.id,
      paymentDatePeriodStart: query.payment_date_period_start,
      paymentDatePeriodEnd: query.payment_date_period_end,
      createdAtPeriodStart: query.created_at_period_start,
      createdAtPeriodEnd: query.created_at_period_end,
      endToEndId: query.end_to_end_id,
      clientDocument: query.client_document,
      // Sort query
      page: query.page,
      pageSize: query.size,
      sort: query.sort,
      order: query.order,
    };

    logger.debug('GetAll payments.', { user, payload });

    // Call get all payment service.
    const result = await getAllPaymentService.execute(payload);

    logger.debug('Payments found.', { result });

    const response = new V2GetAllPaymentRestResponse(result);

    return response;
  }
}
