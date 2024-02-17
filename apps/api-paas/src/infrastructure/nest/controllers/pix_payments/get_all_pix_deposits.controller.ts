import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
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
  IsDateAfterThan,
  IsDateBeforeThan,
  IsIsoStringDateFormat,
  cpfMask,
  isCpf,
  HasPermission,
  DefaultApiHeaders,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { PixDepositState } from '@zro/pix-payments/domain';
import {
  GetAllPixDepositByWalletResponseItem,
  GetAllPixDepositByWalletResponse,
  GetAllPixDepositByWalletRequest,
  GetAllPixDepositByWalletRequestSort,
} from '@zro/pix-payments/interface';
import { GetAllPixDepositByWalletServiceKafka } from '@zro/pix-payments/infrastructure';
import { AuthWallet } from '@zro/operations/domain';
import {
  WalletApiHeader,
  AuthWalletParam,
} from '@zro/operations/infrastructure';

class GetAllPixDepositParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllPixDepositByWalletRequestSort,
  })
  @IsOptional()
  @Sort(GetAllPixDepositByWalletRequestSort)
  sort?: PaginationSort;

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
    description: 'PixDeposit end to end id',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  end_to_end_id?: string;

  @ApiPropertyOptional({
    description: 'PixDeposit client document.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  client_document?: string;

  @ApiPropertyOptional({
    enum: PixDepositState,
    description: 'PixDeposit State.',
    example: [PixDepositState.ERROR, PixDepositState.RECEIVED],
    isArray: true,
  })
  @Transform((params) => {
    if (!params.value) return null;
    return Array.isArray(params.value) ? params.value : [params.value];
  })
  @IsOptional()
  @IsEnum(PixDepositState, { each: true })
  states?: PixDepositState[];
}

class GetAllPixDepositRestResponseItem {
  @ApiProperty({
    description: 'Deposit ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiProperty({
    description: 'Operation ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  operation_id: string;

  @ApiProperty({
    description: 'Deposit available amount.',
    example: 1299,
  })
  available_amount: number;

  @ApiPropertyOptional({
    description: 'Deposit thirdPartName.',
    example: 'Full name.',
  })
  third_part_name: string;

  @ApiPropertyOptional({
    description: 'Deposit thirdPartDocument.',
    example: '***456789**',
  })
  third_part_document: string;

  @ApiProperty({
    enum: PixDepositState,
    description: 'Deposit state.',
    example: PixDepositState.RECEIVED,
  })
  state: PixDepositState;

  @ApiProperty({
    description: 'Deposit created at.',
    example: new Date(),
  })
  created_at: Date;

  constructor(props: GetAllPixDepositByWalletResponseItem) {
    /**
     * If payment type is not "ACCOUNT",
     * we can't return the beneficiary's account number and agency to the payer
     */
    this.id = props.id;
    this.operation_id = props.operationId;
    this.available_amount = props.availableAmount;
    this.third_part_name = props.thirdPartName;
    this.third_part_document = isCpf(props.thirdPartDocument)
      ? cpfMask(props.thirdPartDocument)
      : props.thirdPartDocument;
    this.state = props.state;
    this.created_at = props.createdAt;
  }
}

class GetAllPixDepositRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'PixDeposits data.',
    type: [GetAllPixDepositRestResponseItem],
  })
  data!: GetAllPixDepositRestResponseItem[];

  constructor(props: GetAllPixDepositByWalletResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllPixDepositRestResponseItem(item),
    );
  }
}

/**
 * PixDeposits controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Deposits')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@Controller('pix/deposits')
@HasPermission('api-paas-get-pix-deposits')
export class GetAllPixDepositRestController {
  /**
   * get deposit endpoint.
   */
  @ApiOperation({
    deprecated: true,
    summary: "List user's deposits.",
    description: "Get a list of user's deposits.",
  })
  @ApiOkResponse({
    description: 'The deposits returned successfully.',
    type: GetAllPixDepositRestResponse,
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
    @Query() query: GetAllPixDepositParams,
    @KafkaServiceParam(GetAllPixDepositByWalletServiceKafka)
    getAllPixDepositService: GetAllPixDepositByWalletServiceKafka,
    @LoggerParam(GetAllPixDepositRestController)
    logger: Logger,
  ): Promise<GetAllPixDepositRestResponse> {
    // GetAll payload.
    const payload: GetAllPixDepositByWalletRequest = {
      // PixDeposit query
      userId: user.uuid,
      walletId: wallet.id,
      createdAtPeriodStart: query.created_at_period_start,
      createdAtPeriodEnd: query.created_at_period_end,
      endToEndId: query.end_to_end_id,
      clientDocument: query.client_document,
      states: query.states,
      // Sort query
      page: query.page,
      pageSize: query.size,
      sort: query.sort,
      order: query.order,
    };

    logger.debug('GetAll deposits.', { user, payload });

    // Call get all payment service.
    const result = await getAllPixDepositService.execute(payload);

    logger.debug('Pix Deposits found.', { result });

    const response = new GetAllPixDepositRestResponse(result);

    return response;
  }
}
