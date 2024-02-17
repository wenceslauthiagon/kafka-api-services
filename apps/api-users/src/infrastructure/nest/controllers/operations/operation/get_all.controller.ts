import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import { IsOptional, IsString, Length } from 'class-validator';
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
  IsIsoStringDateFormat,
  IsDateBeforeThan,
  IsDateAfterThan,
  HasPermission,
} from '@zro/common';
import { AuthWallet, OperationState } from '@zro/operations/domain';
import { AuthUser } from '@zro/users/domain';
import {
  GetAllOperationsByUserAndWalletAndFilterResponseItem,
  GetAllOperationsByUserAndWalletAndFilterResponse,
  GetAllOperationsByUserAndWalletAndFilterRequest,
  GetAllOperationsByUserAndWalletAndFilterRequestSort,
} from '@zro/operations/interface';
import {
  AuthWalletParam,
  GetAllOperationsByUserAndWalletAndFilterServiceKafka,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import { AuthUserParam } from '@zro/users/infrastructure';

export class GetAllOperationsQuery extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllOperationsByUserAndWalletAndFilterRequestSort,
  })
  @IsOptional()
  @Sort(GetAllOperationsByUserAndWalletAndFilterRequestSort)
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
    description: 'Operation Created at start.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtStart',
  })
  @IsDateBeforeThan('created_at_end', false, {
    message: 'createdAtStart must be before than createdAtEnd',
  })
  created_at_start?: Date;

  @ApiPropertyOptional({
    description: 'Operation Created at end.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtEnd',
  })
  @IsDateAfterThan('created_at_start', false, {
    message: 'createdAtEnd must be after than createdAtStart',
  })
  created_at_end?: Date;
}

class GetAllOperationsRestResponseItem {
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
    description: 'Transaction id.',
    example: 2,
  })
  transaction_id: number;

  @ApiProperty({
    description: 'Transaction tag.',
    example: 'BRL',
  })
  transaction_tag: string;

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

  constructor(props: GetAllOperationsByUserAndWalletAndFilterResponseItem) {
    this.id = props.id;
    this.fee = props.fee;
    this.state = props.state;
    this.description = props.description;
    this.value = props.value;
    this.created_at = props.createdAt;
    this.reverted_at = props.revertedAt;
    this.currency_id = props.currencyId;
    this.currency_symbol = props.currencySymbol;
    this.transaction_id = props.transactionId;
    this.transaction_tag = props.transactionTag;
    this.owner_wallet_uuid = props.ownerWalletUuid;
    this.beneficiary_wallet_uuid = props.beneficiaryWalletUuid;
    this.operation_ref_id = props.operationRefId;
    this.chargeback_id = props.chargebackId;
  }
}

export class GetAllOperationsRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'Operations data.',
    type: [GetAllOperationsRestResponseItem],
  })
  data!: GetAllOperationsRestResponseItem[];

  constructor(props: GetAllOperationsByUserAndWalletAndFilterResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllOperationsRestResponseItem(item),
    );
  }
}

/**
 * Operations controller. Controller is protected by JWT access token.
 */
@ApiTags('Operations | Operation')
@Controller('operations')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@HasPermission('api-users-get-operations')
export class GetAllOperationsRestController {
  /**
   * get operations endpoint.
   */
  @ApiOperation({
    summary: "List user's operations.",
    description: "Get a list of user's operations.",
  })
  @ApiOkResponse({
    description: 'The operations returned successfully.',
    type: GetAllOperationsRestResponse,
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
    @Query() query: GetAllOperationsQuery,
    @KafkaServiceParam(GetAllOperationsByUserAndWalletAndFilterServiceKafka)
    getAllOperationsService: GetAllOperationsByUserAndWalletAndFilterServiceKafka,
    @LoggerParam(GetAllOperationsRestController)
    logger: Logger,
  ): Promise<GetAllOperationsRestResponse> {
    // GetAll payload.
    const payload: GetAllOperationsByUserAndWalletAndFilterRequest = {
      userId: user.uuid,
      walletId: wallet.id,
      currencySymbol: query.currency_symbol,
      transactionTag: query.transaction_tag,
      createdAtStart: query.created_at_start,
      createdAtEnd: query.created_at_end,
      // Sort query
      page: query.page,
      pageSize: query.size,
      sort: query.sort,
      order: query.order,
    };

    logger.debug('GetAll operations.', { payload });

    // Call get all operation service.
    const result = await getAllOperationsService.execute(payload);

    logger.debug('Operations found.', { result });

    const response = new GetAllOperationsRestResponse(result);

    return response;
  }
}
