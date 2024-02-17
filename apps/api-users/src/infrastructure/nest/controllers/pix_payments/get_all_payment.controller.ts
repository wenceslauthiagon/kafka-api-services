import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
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
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthWallet } from '@zro/operations/domain';
import { PaymentState } from '@zro/pix-payments/domain';
import {
  GetAllPaymentByWalletResponseItem,
  GetAllPaymentByWalletResponse,
  GetAllPaymentByWalletRequest,
  GetAllPaymentByWalletRequestSort,
} from '@zro/pix-payments/interface';
import { AuthUserParam } from '@zro/users/infrastructure';
import { GetAllPaymentByWalletServiceKafka } from '@zro/pix-payments/infrastructure';
import {
  AuthWalletParam,
  WalletApiHeader,
} from '@zro/operations/infrastructure';

class GetAllPaymentByWalletParams extends PaginationParams {
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
}

class GetAllPaymentByWalletRestResponseItem {
  @ApiProperty({
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    enum: PaymentState,
    description: 'Payment state.',
    example: PaymentState.SCHEDULED,
  })
  state: PaymentState;

  @ApiPropertyOptional({
    description:
      'Operation UUID. This will not be returned if the payment was scheduled.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
    required: false,
  })
  operation_id?: string;

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

  @ApiProperty({
    description: 'Date of created payment.',
    example: new Date(),
  })
  created_at!: Date;

  @ApiPropertyOptional({
    description: 'The payment beneficiary name.',
  })
  beneficiary_name?: string;

  constructor(props: GetAllPaymentByWalletResponseItem) {
    /**
     * If payment type is not "ACCOUNT",
     * we can't return the beneficiary's account number and agency to the payer
     */
    this.id = props.id;
    this.state = props.state;
    this.operation_id = props.operationId;
    this.value = props.value;
    this.payment_date = props.paymentDate;
    this.created_at = props.createdAt;
    this.beneficiary_name = props.beneficiaryName;
  }
}

class GetAllPaymentByWalletRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'Payments data.',
    type: [GetAllPaymentByWalletRestResponseItem],
  })
  data!: GetAllPaymentByWalletRestResponseItem[];

  constructor(props: GetAllPaymentByWalletResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllPaymentByWalletRestResponseItem(item),
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
@HasPermission('api-users-get-pix-payments')
export class GetAllPaymentRestController {
  /**
   * get payment endpoint.
   */
  @ApiOperation({
    summary: "List user's payments.",
    description: "Get a list of user's payments.",
  })
  @ApiOkResponse({
    description: 'The payments returned successfully.',
    type: GetAllPaymentByWalletRestResponse,
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
    @AuthWalletParam() wallet: AuthWallet,
    @Query() query: GetAllPaymentByWalletParams,
    @KafkaServiceParam(GetAllPaymentByWalletServiceKafka)
    getAllPaymentService: GetAllPaymentByWalletServiceKafka,
    @LoggerParam(GetAllPaymentRestController)
    logger: Logger,
  ): Promise<GetAllPaymentByWalletRestResponse> {
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

    const response = new GetAllPaymentByWalletRestResponse(result);

    return response;
  }
}
