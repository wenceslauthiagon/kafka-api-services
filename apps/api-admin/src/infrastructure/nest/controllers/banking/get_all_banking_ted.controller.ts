import { Logger } from 'winston';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
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
import { AdminBankingTedState } from '@zro/banking/domain';
import {
  GetAllAdminBankingTedResponseItem,
  GetAllAdminBankingTedResponse,
  GetAllAdminBankingTedRequest,
  GetAllAdminBankingTedRequestSort,
} from '@zro/banking/interface';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';
import { GetAllAdminBankingTedServiceKafka } from '@zro/banking/infrastructure';

export class GetAllBankingTedParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllAdminBankingTedRequestSort,
  })
  @IsOptional()
  @Sort(GetAllAdminBankingTedRequestSort)
  sort?: PaginationSort;

  @ApiPropertyOptional({
    description: 'Source Account ID.',
  })
  @IsOptional()
  @IsUUID(4)
  source_id?: string;

  @ApiPropertyOptional({
    description: 'Destination Account ID.',
  })
  @IsOptional()
  @IsUUID(4)
  destination_id?: string;

  @ApiPropertyOptional({
    description: 'TED state.',
    enum: AdminBankingTedState,
  })
  @IsOptional()
  @IsEnum(AdminBankingTedState)
  state?: AdminBankingTedState;

  @ApiPropertyOptional({
    description: 'Transaction ID.',
  })
  @IsOptional()
  @IsUUID(4)
  transaction_id?: string;

  @ApiPropertyOptional({
    description: 'CreatedAt date start range.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtStart',
  })
  @IsDateBeforeThan('createdAtEnd', true, {
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
  @IsDateAfterThan('createdAtStart', true, {
    message: 'createdAtEnd must be after than createdAtStart',
  })
  created_at_end?: Date;

  @ApiPropertyOptional({
    description: 'ConfirmedAt date start range.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date confirmedAtStart',
  })
  @IsDateBeforeThan('confirmedAtEnd', true, {
    message: 'confirmedAtStart must be before than confirmedAtEnd',
  })
  confirmed_at_start?: Date;

  @ApiPropertyOptional({
    description: 'ConfirmedAt date end range.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date confirmedAtEnd',
  })
  @IsDateAfterThan('confirmedAtStart', true, {
    message: 'confirmedAtEnd must be after than confirmedAtStart',
  })
  confirmed_at_end?: Date;

  @ApiPropertyOptional({
    description: 'FailedAt date start range.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date failedAtStart',
  })
  @IsDateBeforeThan('failedAtEnd', true, {
    message: 'failedAtStart must be before than failedAtEnd',
  })
  failed_at_start?: Date;

  @ApiPropertyOptional({
    description: 'FailedAt date end range.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date failedAtEnd',
  })
  @IsDateAfterThan('failedAtStart', true, {
    message: 'failedAtEnd must be after than failedAtStart',
  })
  failed_at_end?: Date;
}

class GetAllBankingTedRestResponseItem {
  @ApiProperty({
    description: 'Banking TED ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiProperty({
    description: 'Source Account ID.',
    example: '11a16a03-6dc4-48fd-9376-380c3c27afef',
  })
  source_id: string;

  @ApiProperty({
    description: 'Destination Account ID.',
    example: '04ae2c48-068f-4181-bfb8-ac6d2b62888f',
  })
  destination_id: string;

  @ApiProperty({
    description: 'TED state.',
    example: AdminBankingTedState.CONFIRMED,
  })
  state: AdminBankingTedState;

  @ApiProperty({
    description: 'TED description.',
    example: 'description',
  })
  description: string;

  @ApiPropertyOptional({
    description: 'Transaction ID.',
    example: 'f5e5be1b-2d58-42a8-acb3-ef44c0a636e9',
  })
  transaction_id?: string;

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
    description: 'Failure code.',
    example: '100',
  })
  failure_code?: string;

  @ApiPropertyOptional({
    description: 'Failure message.',
    example: 'failure message',
  })
  failure_message?: string;

  @ApiPropertyOptional({
    description: 'TED created at.',
    example: new Date(),
  })
  created_at?: Date;

  @ApiPropertyOptional({
    description: 'TED confirmed at.',
    example: new Date(),
  })
  confirmed_at?: Date;

  @ApiPropertyOptional({
    description: 'TED failed at.',
    example: new Date(),
  })
  failed_at?: Date;

  @ApiPropertyOptional({
    description: 'TED forwarded at.',
    example: new Date(),
  })
  forwarded_at: Date;

  constructor(props: GetAllAdminBankingTedResponseItem) {
    this.id = props.id;
    this.source_id = props.sourceId;
    this.destination_id = props.destinationId;
    this.state = props.state;
    this.description = props.description;
    this.transaction_id = props.transactionId;
    this.created_by_admin_id = props.createdByAdminId;
    this.updated_by_admin_id = props.updatedByAdminId;
    this.failure_code = props.failureCode;
    this.failure_message = props.failureMessage;
    this.created_at = props.createdAt;
    this.confirmed_at = props.confirmedAt;
    this.failed_at = props.failedAt;
    this.forwarded_at = props.forwardedAt;
  }
}

export class GetAllBankingTedRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'Banking teds data.',
    type: [GetAllBankingTedRestResponseItem],
  })
  data!: GetAllBankingTedRestResponseItem[];

  constructor(props: GetAllAdminBankingTedResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllBankingTedRestResponseItem(item),
    );
  }
}

/**
 * Banking teds controller. Controller is protected by JWT access token.
 */
@ApiTags('Banking')
@ApiBearerAuth()
@Controller('banking/teds')
export class GetAllBankingTedRestController {
  /**
   * get banking teds endpoint.
   */
  @ApiOperation({
    summary: 'List the banking teds.',
    description: 'List the banking teds.',
  })
  @ApiOkResponse({
    description: 'The banking teds returned successfully.',
    type: GetAllBankingTedRestResponse,
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
    @KafkaServiceParam(GetAllAdminBankingTedServiceKafka)
    getAllService: GetAllAdminBankingTedServiceKafka,
    @LoggerParam(GetAllBankingTedRestController)
    logger: Logger,
    @Query() params: GetAllBankingTedParams,
  ): Promise<GetAllBankingTedRestResponse> {
    // GetAll a payload.
    const payload: GetAllAdminBankingTedRequest = {
      page: params.page,
      pageSize: params.size,
      sort: params.sort,
      order: params.order,
      sourceId: params.source_id,
      destinationId: params.destination_id,
      state: params.state,
      transactionId: params.transaction_id,
      createdAtStart: params.created_at_start,
      createdAtEnd: params.created_at_end,
      confirmedAtStart: params.confirmed_at_start,
      confirmedAtEnd: params.confirmed_at_end,
      failedAtStart: params.failed_at_start,
      failedAtEnd: params.failed_at_end,
    };

    logger.debug('GetAll banking teds.', { admin, payload });

    // Call get bank service.
    const result = await getAllService.execute(payload);

    logger.debug('Bank teds found.', { result });

    const response = new GetAllBankingTedRestResponse(result);

    return response;
  }
}
