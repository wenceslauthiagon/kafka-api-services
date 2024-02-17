import { Logger } from 'winston';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Controller, Get, Query } from '@nestjs/common';
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
} from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import {
  GetAllTaxResponseItem,
  GetAllTaxResponse,
  GetAllTaxRequest,
  GetAllTaxRequestSort,
} from '@zro/quotations/interface';
import {
  AuthAdminParam,
  GetAllTaxServiceKafka,
} from '@zro/api-admin/infrastructure';

class GetAllTaxParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllTaxRequestSort,
  })
  @IsOptional()
  @Sort(GetAllTaxRequestSort)
  sort?: PaginationSort;

  @ApiPropertyOptional({
    description: 'Tax name.',
    minLength: 1,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string;
}

class GetAllTaxRestResponseItem {
  @ApiProperty({
    description: 'Tax ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    description: 'Tax name.',
    example: 'USD',
  })
  name!: string;

  @ApiProperty({
    description: 'Tax value.',
  })
  value!: number;

  @ApiProperty({
    description: 'Tax format.',
    example: '[VALUE]%',
  })
  format!: string;

  @ApiProperty({
    description: 'Tax formatted value.',
    example: '0.32%',
  })
  formatted_value!: string;

  @ApiProperty({
    description: 'Tax created at.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: GetAllTaxResponseItem) {
    this.id = props.id;
    this.name = props.name;
    this.value = props.value;
    this.format = props.format;
    this.formatted_value = props.formattedValue;
    this.created_at = props.createdAt;
  }
}

class GetAllTaxRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'Taxes data.',
    type: [GetAllTaxRestResponseItem],
  })
  data!: GetAllTaxRestResponseItem[];

  constructor(props: GetAllTaxResponse) {
    super(props);
    this.data = props.data.map((item) => new GetAllTaxRestResponseItem(item));
  }
}

/**
 * Taxes controller. Controller is protected by JWT access token.
 */
@ApiTags('Tax')
@ApiBearerAuth()
@Controller()
export class GetAllTaxRestController {
  /**
   * List tax endpoint.
   */
  @ApiOperation({
    deprecated: true,
    summary: 'List the taxes.',
    description: 'List the taxes. <b>Must use the path "quotations/taxes".</b>',
  })
  @ApiOkResponse({
    description: 'The taxes returned successfully.',
    type: GetAllTaxRestResponse,
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
  @Get('otc/taxes')
  async executeOld(
    @AuthAdminParam() admin: AuthAdmin,
    @KafkaServiceParam(GetAllTaxServiceKafka)
    getAllService: GetAllTaxServiceKafka,
    @LoggerParam(GetAllTaxRestController)
    logger: Logger,
    @Query() params: GetAllTaxParams,
  ): Promise<GetAllTaxRestResponse> {
    return this.execute(admin, getAllService, logger, params);
  }

  /**
   * List tax endpoint.
   */
  @ApiOperation({
    summary: 'List the taxes.',
    description: 'List the taxes.',
  })
  @ApiOkResponse({
    description: 'The taxes returned successfully.',
    type: GetAllTaxRestResponse,
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
  @Get('quotations/taxes')
  async execute(
    @AuthAdminParam() admin: AuthAdmin,
    @KafkaServiceParam(GetAllTaxServiceKafka)
    getAllService: GetAllTaxServiceKafka,
    @LoggerParam(GetAllTaxRestController)
    logger: Logger,
    @Query() params: GetAllTaxParams,
  ): Promise<GetAllTaxRestResponse> {
    // Get all taxes as payload.
    const payload: GetAllTaxRequest = {
      name: params.name,
      page: params.page,
      pageSize: params.size,
      sort: params.sort,
      order: params.order,
    };

    logger.debug('Get all taxes.', { admin });

    // Call get tax service.
    const result = await getAllService.execute(payload);

    logger.debug('Taxes found.', { result });

    const response = new GetAllTaxRestResponse(result);

    return response;
  }
}
