import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
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
} from '@zro/common';
import {
  GetAllWarningPixDepositRequest,
  GetAllWarningPixDepositRequestSort,
  GetAllWarningPixDepositResponse,
  GetAllWarningPixDepositResponseItem,
} from '@zro/pix-payments/interface';
import { WarningPixDepositState } from '@zro/pix-payments/domain';
import { AuthAdmin } from '@zro/api-admin/domain';
import { GetAllWarningPixDepositServiceKafka } from '@zro/pix-payments/infrastructure';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';

export class GetAllWarningPixDepositParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllWarningPixDepositRequestSort,
  })
  @IsOptional()
  @Sort(GetAllWarningPixDepositRequestSort)
  sort?: PaginationSort;

  @ApiPropertyOptional({
    description: 'Transaction tag.',
  })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  transaction_tag?: string;

  @ApiPropertyOptional({
    description: 'User ID.',
  })
  @IsUUID(4)
  @IsOptional()
  user_id?: string;

  @ApiPropertyOptional({
    description: 'Operation ID.',
  })
  @IsUUID(4)
  @IsOptional()
  operation_id?: string;

  @ApiPropertyOptional({
    description: 'Created at start date period for warning transactions.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date created_at_period_start',
  })
  @IsDateBeforeThan('created_at_period_end', false, {
    message:
      'created_at_period_start must be before than created_at_period_end',
  })
  created_at_period_start?: Date;

  @ApiPropertyOptional({
    description: 'Created at end date period for warning transactions.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date created_at_period_end',
  })
  @IsDateAfterThan('created_at_period_start', false, {
    message: 'created_at_period_end must be after than created_at_period_start',
  })
  created_at_period_end?: Date;

  @ApiPropertyOptional({
    description: 'Updated at start date period for warning transactions.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date updated_at_period_start',
  })
  @IsDateBeforeThan('updated_at_period_end', false, {
    message:
      'updated_at_period_start must be before than updated_at_period_end',
  })
  updated_at_period_start?: Date;

  @ApiPropertyOptional({
    description: 'Updated at end date period for warning transactions.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date updated_at_period_end',
  })
  @IsDateAfterThan('updated_at_period_start', false, {
    message: 'updated_at_period_end must be after than updated_at_period_start',
  })
  updated_at_period_end?: Date;
}

class GetAllWarningPixDepositRestResponseItem {
  @ApiProperty({
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    description: 'Operation UUID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  operation_id: string;

  @ApiProperty({
    description: 'Transaction tag.',
    example: 'PIXREC',
  })
  transaction_tag: string;

  @ApiProperty({
    enum: WarningPixDepositState,
    description: 'Warning pix deposit state.',
    example: [WarningPixDepositState.APPROVED, WarningPixDepositState.REJECTED],
  })
  state: WarningPixDepositState;

  @ApiPropertyOptional({
    description: 'Warning pix deposit rejected reason.',
    example: null,
    required: false,
    nullable: true,
  })
  rejected_reason?: string;

  @ApiProperty({
    description: 'Date of created Warning Pix Deposit.',
    example: new Date(),
  })
  created_at!: Date;

  @ApiProperty({
    description: 'Date of updated Warning Pix Deposit.',
    example: new Date(),
  })
  updated_at!: Date;

  constructor(props: GetAllWarningPixDepositResponseItem) {
    this.id = props.id;
    this.operation_id = props.operationId;
    this.transaction_tag = props.transactionTag;
    this.state = props.state;
    this.rejected_reason = props.rejectedReason;
    this.created_at = props.createdAt;
    this.updated_at = props.updatedAt;
  }
}

export class GetAllWarningPixDepositRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'Warning Pix Deposits data.',
    type: [GetAllWarningPixDepositRestResponseItem],
  })
  data!: GetAllWarningPixDepositRestResponseItem[];

  constructor(props: GetAllWarningPixDepositResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllWarningPixDepositRestResponseItem(item),
    );
  }
}

/**
 * Warning pix deposits controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Warning | Deposits')
@ApiBearerAuth()
@Controller('pix/warning/deposits')
export class GetAllWarningPixDepositRestController {
  /**
   * get warning pix deposit endpoint.
   */
  @ApiOperation({
    summary: "List user's warning pix deposits.",
    description: "Get a list of user's warning pix deposits.",
  })
  @ApiOkResponse({
    description: 'The warning pix deposit returned successfully.',
    type: GetAllWarningPixDepositRestResponse,
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
    @Query() query: GetAllWarningPixDepositParams,
    @KafkaServiceParam(GetAllWarningPixDepositServiceKafka)
    getAllWarningPixDepositService: GetAllWarningPixDepositServiceKafka,
    @LoggerParam(GetAllWarningPixDepositRestController)
    logger: Logger,
  ): Promise<GetAllWarningPixDepositRestResponse> {
    // GetAll payload.
    const payload: GetAllWarningPixDepositRequest = {
      // Warning Pix Deposit query
      userId: query.user_id,
      transactionTag: query.transaction_tag,
      operationId: query.operation_id,
      createdAtPeriodStart: query.created_at_period_start,
      createdAtPeriodEnd: query.created_at_period_end,
      updatedAtPeriodStart: query.updated_at_period_start,
      updatedAtPeriodEnd: query.updated_at_period_end,
      // Sort query
      page: query.page,
      pageSize: query.size,
      sort: query.sort,
      order: query.order,
    };

    logger.debug('Get all warning pix deposits.', { admin, payload });

    // Call get all WarningPixDeposit service.
    const result = await getAllWarningPixDepositService.execute(payload);

    logger.debug('Warning pix deposits found.', { result });

    const response = new GetAllWarningPixDepositRestResponse(result);

    return response;
  }
}
