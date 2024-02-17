import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Length,
} from 'class-validator';
import { Throttle } from '@nestjs/throttler';
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
  KafkaServiceParam,
  LoggerParam,
  PaginationParams,
  PaginationRestResponse,
  PaginationSort,
  Sort,
  IsIsoStringDateFormat,
  IsDateAfterThan,
  IsDateBeforeThan,
  HasPermission,
  DefaultApiHeaders,
  IsSameMonth,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthWallet, OperationState } from '@zro/operations/domain';
import {
  GetStatementResponseItem,
  GetStatementResponse,
  GetStatementRequest,
  GetStatementRequestSort,
} from '@zro/operations/interface';
import {
  AuthWalletParam,
  GetStatementServiceKafka,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import { AuthUserParam } from '@zro/users/infrastructure';

export class GetStatementQuery extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetStatementRequestSort,
  })
  @IsOptional()
  @Sort(GetStatementRequestSort)
  sort?: PaginationSort;

  @ApiPropertyOptional({
    description: 'Operation currency symbol.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  currency_symbol?: string;

  @ApiPropertyOptional({
    description: 'Operation Transaction tag.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  transaction_tag?: string;

  @ApiPropertyOptional({
    description: 'Value in cents (R$).',
  })
  @IsOptional()
  @Transform((params) => params && parseInt(params.value))
  @IsInt()
  @IsPositive()
  value?: number;

  @ApiPropertyOptional({
    enum: OperationState,
    description: 'Operation State.',
    example: [OperationState.ACCEPTED, OperationState.REVERTED],
    isArray: true,
  })
  @Transform((params) => {
    if (!params.value) return null;
    return Array.isArray(params.value) ? params.value : [params.value];
  })
  @IsOptional()
  @IsEnum(OperationState, { each: true })
  states?: OperationState[];

  @ApiPropertyOptional({
    description: 'Operation Created at start.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date created_at_start',
  })
  @IsDateBeforeThan('created_at_end', false, {
    message: 'created_at_start must be before than created_at_end',
  })
  @IsSameMonth('created_at_end', false, {
    message: 'created_at_start must have the same month as the created_at_end',
  })
  created_at_start?: Date;

  @ApiPropertyOptional({
    description: 'Operation Created at end.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date created_at_end',
  })
  @IsDateAfterThan('created_at_start', false, {
    message: 'created_at_end must be after than created_at_start',
  })
  @IsSameMonth('created_at_start', false, {
    message: 'created_at_end must have the same month as the created_at_start',
  })
  created_at_end?: Date;
}

class GetStatementRestResponseItem {
  @ApiProperty({
    description: 'Operation id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'Operation fee in cents.',
    example: 0,
  })
  fee?: number;

  @ApiProperty({
    description: 'Operation state.',
    enum: OperationState,
    example: OperationState.ACCEPTED,
  })
  state: OperationState;

  @ApiProperty({
    description: 'Operation description.',
  })
  description: string;

  @ApiPropertyOptional({
    description: 'Operation value in cents.',
    example: 1880000,
  })
  value: number;

  @ApiPropertyOptional({
    description: 'Updated balance in cents.',
    example: 10000,
  })
  updated_balance?: number;

  @ApiProperty({
    description: 'Operation created at.',
    example: new Date(),
  })
  created_at: Date;

  @ApiPropertyOptional({
    description: 'Operation reverted at.',
    example: new Date(),
  })
  reverted_at?: Date;

  @ApiProperty({
    description: 'Currency id.',
    example: 2,
  })
  currency_id: number;

  @ApiProperty({
    description: 'Currency symbol.',
    example: 'R$',
  })
  currency_symbol: string;

  @ApiProperty({
    description: 'Transaction type id.',
    example: 2,
  })
  transaction_type_id: number;

  @ApiProperty({
    description: 'Transaction tag.',
    example: 'BRL',
  })
  transaction_tag: string;

  @ApiPropertyOptional({
    description: 'Transaction type.',
    example: 'C',
  })
  transaction_type?: string;

  @ApiPropertyOptional({
    description: 'Operation owner wallet.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  owner_wallet_uuid?: string;

  @ApiPropertyOptional({
    description: 'Operation beneficiary wallet uuid.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  beneficiary_wallet_uuid?: string;

  @ApiPropertyOptional({
    description: 'Operation ref id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  operation_ref_id?: string;

  @ApiPropertyOptional({
    description: 'Operation chargeback id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  chargeback_id?: string;

  constructor(props: GetStatementResponseItem) {
    this.id = props.id;
    this.fee = props.fee;
    this.state = props.state;
    this.description = props.description;
    this.value = props.value;
    this.updated_balance = props.updatedBalance;
    this.created_at = props.createdAt;
    this.reverted_at = props.revertedAt;
    this.currency_id = props.currencyId;
    this.currency_symbol = props.currencySymbol;
    this.transaction_type_id = props.transactionTypeId;
    this.transaction_tag = props.transactionTag;
    this.transaction_type = props.transactionType;
    this.owner_wallet_uuid = props.ownerWalletUuid;
    this.beneficiary_wallet_uuid = props.beneficiaryWalletUuid;
    this.operation_ref_id = props.operationRefId;
    this.chargeback_id = props.chargebackId;
  }
}

export class GetStatementRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'Statement data.',
    type: [GetStatementRestResponseItem],
  })
  data!: GetStatementRestResponseItem[];

  constructor(props: GetStatementResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetStatementRestResponseItem(item),
    );
  }
}

/**
 * Operations controller. Controller is protected by JWT access token.
 */
@ApiTags('Operations | Operation')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@Controller('operations/statement')
@HasPermission('api-paas-get-statement')
export class GetStatementRestController {
  /**
   * get statement endpoint.
   */
  @ApiOperation({
    summary: 'User statement.',
    description: "Get a list of user's operations",
  })
  @ApiOkResponse({
    description: 'The operations returned successfully.',
    type: GetStatementRestResponse,
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
  @Throttle(100, 1)
  async execute(
    @AuthUserParam() user: AuthUser,
    @AuthWalletParam() wallet: AuthWallet,
    @Query() query: GetStatementQuery,
    @KafkaServiceParam(GetStatementServiceKafka)
    getStatementService: GetStatementServiceKafka,
    @LoggerParam(GetStatementRestController)
    logger: Logger,
  ): Promise<GetStatementRestResponse> {
    // GetStatement payload.
    const payload: GetStatementRequest = {
      userId: user.uuid,
      walletId: wallet.id,
      currencySymbol: query.currency_symbol,
      transactionTag: query.transaction_tag,
      createdAtStart: query.created_at_start,
      value: query.value,
      states: query.states,
      createdAtEnd: query.created_at_end,
      // Sort query
      page: query.page,
      pageSize: query.size,
      sort: query.sort,
      order: query.order,
    };

    logger.debug('GetStatement.', { user, payload });

    // Call get statement operation service.
    const result = await getStatementService.execute(payload);

    logger.debug('Statements found.', { result });

    const response = new GetStatementRestResponse(result);

    return response;
  }
}
