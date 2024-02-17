import { Logger } from 'winston';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsPositive, IsUUID } from 'class-validator';
import { Controller, Get, Query } from '@nestjs/common';
import {
  IsBiggestThan,
  IsDateAfterThan,
  IsDateBeforeThan,
  IsIsoStringDateFormat,
  IsSmallerThan,
  KafkaServiceParam,
  LoggerParam,
  PaginationParams,
  PaginationRestResponse,
  PaginationSort,
  Sort,
} from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import {
  Provider,
  RemittanceOrderSide,
  RemittanceOrderStatus,
  RemittanceOrderType,
  RemittanceStatus,
  System,
} from '@zro/otc/domain';
import { Currency } from '@zro/operations/domain';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';
import {
  GetAllRemittanceOrdersByFilterRequest,
  GetAllRemittanceOrdersByFilterRequestSort,
  GetAllRemittanceOrdersByFilterResponse,
  GetAllRemittanceOrdersByFilterResponseItem,
} from '@zro/otc/interface';
import { GetAllRemittanceOrdersByFilterServiceKafka } from '@zro/otc/infrastructure';

class GetAllRemittanceOrderByFilterParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllRemittanceOrdersByFilterRequestSort,
  })
  @IsOptional()
  @Sort(GetAllRemittanceOrdersByFilterRequestSort)
  sort?: PaginationSort;

  @ApiPropertyOptional({
    enum: RemittanceOrderSide,
    description: 'Remittance order side.',
  })
  @IsOptional()
  @IsEnum(RemittanceOrderSide)
  side?: RemittanceOrderSide;

  @ApiPropertyOptional({
    description: 'Remittance order currency.',
  })
  @IsOptional()
  @Transform((params) => params && parseInt(params.value))
  currency_id?: number;

  @ApiPropertyOptional({
    description: 'Remittance order amount range start.',
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @IsSmallerThan('amount_end', true, {
    message: 'amount_start must be smaller than amount_end',
  })
  @Transform((params) => params && parseInt(params.value))
  amount_start?: number;

  @ApiPropertyOptional({
    description: 'Remittance order amount range end.',
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @IsBiggestThan('amount_start', true, {
    message: 'amount_end must be greater than amount_start',
  })
  @Transform((params) => params && parseInt(params.value))
  amount_end?: number;

  @ApiPropertyOptional({
    enum: RemittanceOrderStatus,
    description: 'Remittance order status.',
  })
  @IsOptional()
  @IsEnum(RemittanceOrderStatus)
  status?: RemittanceOrderStatus;

  @ApiPropertyOptional({
    description: 'Remittance order system.',
  })
  @IsOptional()
  system_id?: string;

  @ApiPropertyOptional({
    description: 'Remittance order provider string.',
  })
  @IsOptional()
  provider_id?: string;

  @ApiPropertyOptional({
    enum: RemittanceOrderType,
    description: 'Remittance order status.',
  })
  @IsOptional()
  @IsEnum(RemittanceOrderType)
  type?: RemittanceOrderType;

  @ApiPropertyOptional({
    description: 'CreatedAt date start range remittance order.',
    format: 'YYYY-MM-DD',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date created_at_start',
  })
  @IsDateBeforeThan('created_at_end', true, {
    message: 'created_at_start must be before than created_at_end',
  })
  created_at_start?: Date;

  @ApiPropertyOptional({
    description: 'CreatedAt date end range remittance order.',
    format: 'YYYY-MM-DD',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date created_at_end',
  })
  @IsDateAfterThan('created_at_start', true, {
    message: 'created_at_end must be after than created_at_start',
  })
  created_at_end?: Date;

  @ApiPropertyOptional({
    description: 'UpdatedAt date start range remittance order',
    format: 'YYYY-MM-DD',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date updated_at_start',
  })
  @IsDateBeforeThan('update_at_end', true, {
    message: 'updated_at_start must be before than updated_at_end',
  })
  updated_at_start?: Date;

  @ApiPropertyOptional({
    description: 'UpdatedAt date end range remittance order.',
    format: 'YYYY-MM-DD',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date updated_at_end',
  })
  @IsDateAfterThan('updated_at_start', true, {
    message: 'updated_at_end must be after than updated_at_start',
  })
  updated_at_end?: Date;

  @ApiPropertyOptional({
    description: 'Remittance id.',
  })
  @IsOptional()
  @IsUUID(4)
  remittance_id?: string;

  @ApiPropertyOptional({
    enum: RemittanceStatus,
    description: 'Remittance status.',
  })
  @IsOptional()
  @IsEnum(RemittanceStatus)
  remittance_status?: RemittanceStatus;
}

class GetAllRemittanceOrdersByFilterRestResponseItem {
  @ApiProperty({
    description: 'RemittanceOrder ID.',
    example: '295564a9-c5fd-4e73-9abb-72e0383f2dfb',
  })
  id: string;

  @ApiProperty({
    enum: RemittanceOrderSide,
    description: 'Remittance order side.',
  })
  side: RemittanceOrderSide;

  @ApiProperty({
    description: 'RemittanceOrder Currency.',
  })
  currency: Currency;

  @ApiProperty({
    description: 'RemittanceOrder amount.',
    example: '14533',
  })
  amount: number;

  @ApiProperty({
    enum: RemittanceOrderStatus,
    description: 'Remittance order status.',
  })
  status: RemittanceOrderStatus;

  @ApiProperty({
    description: 'RemittanceOrder System.',
  })
  system: System;

  @ApiProperty({
    description: 'RemittanceOrder Provider.',
  })
  provider: Provider;

  @ApiPropertyOptional({
    enum: RemittanceOrderType,
    description: 'Remittance order type.',
  })
  type?: RemittanceOrderType;

  @ApiPropertyOptional({
    description: 'Remittance ID.',
  })
  remittances?: [];

  @ApiProperty({
    description: 'Remittance order updatedAt.',
    example: new Date(),
  })
  updated_at!: Date;

  @ApiProperty({
    description: 'Remittance order createdAt.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: GetAllRemittanceOrdersByFilterResponseItem) {
    this.id = props.id;
    this.side = props.side;
    this.currency = props.currency;
    this.amount = props.amount;
    this.status = props.status;
    this.system = props.system;
    this.provider = props.provider;
    this.type = props.type;
    this.created_at = props.createdAt;
    this.updated_at = props.updatedAt;
    this.remittances = props.remittances;
  }
}

class GetAllRemittanceOrdersByFilterRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'Remittance order data.',
    type: [GetAllRemittanceOrdersByFilterRestResponseItem],
  })
  data!: GetAllRemittanceOrdersByFilterRestResponseItem[];

  constructor(props: GetAllRemittanceOrdersByFilterResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllRemittanceOrdersByFilterRestResponseItem(item),
    );
  }
}

/**
 * Get all remittance orders by filter controller. Controller is protected by admin JWT access token.
 */
@ApiTags('Otc | Remittance Orders')
@ApiBearerAuth()
@Controller('otc/remittance-orders')
export class GetAllRemittanceOrdersByFilterRestController {
  /**
   * Get all remittance orders by filter endpoint.
   */
  @ApiOperation({
    summary: 'Get all remittance orders by filter.',
    description: 'List all existent remittance orders filtered.',
  })
  @ApiOkResponse({
    description: 'Remittance orders have been successfully returned.',
    type: GetAllRemittanceOrdersByFilterRestResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Admin authentication failed.',
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
    @Query() params: GetAllRemittanceOrderByFilterParams,
    @KafkaServiceParam(GetAllRemittanceOrdersByFilterServiceKafka)
    service: GetAllRemittanceOrdersByFilterServiceKafka,
    @LoggerParam(GetAllRemittanceOrdersByFilterRestController)
    logger: Logger,
  ): Promise<GetAllRemittanceOrdersByFilterRestResponse> {
    // Create a payload.
    const payload: GetAllRemittanceOrdersByFilterRequest = {
      side: params.side,
      currencyId: params.currency_id,
      amountStart: params.amount_start,
      amountEnd: params.amount_end,
      status: params.status,
      systemId: params.system_id,
      providerId: params.provider_id,
      type: params.type,
      createdAtStart: params.created_at_start,
      createdAtEnd: params.created_at_end,
      updatedAtStart: params.updated_at_start,
      updatedAtEnd: params.updated_at_end,
      remittanceId: params.remittance_id,
      remittanceStatus: params.remittance_status,
    };

    logger.debug('Get all remittance orders by filter.', { admin, payload });

    // Call get all remittance orders by filter service.
    const result = await service.execute(payload);

    logger.debug('Remittance orders found.', { result });

    const response = new GetAllRemittanceOrdersByFilterRestResponse(result);

    return response;
  }
}
