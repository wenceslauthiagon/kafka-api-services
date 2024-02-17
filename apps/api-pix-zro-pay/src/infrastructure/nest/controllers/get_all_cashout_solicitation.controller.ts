import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import { IsOptional } from 'class-validator';
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
import {
  AuthCompany,
  CashOutSolicitationStatus,
} from '@zro/pix-zro-pay/domain';
import {
  AuthCompanyParam,
  GetAllCashOutSolicitationServiceKafka,
} from '@zro/pix-zro-pay/infrastructure';
import {
  GetAllCashOutSolicitationRequest,
  GetAllCashOutSolicitationResponse,
  GetAllCashOutSolicitationResponseItem,
  GetAllCashOutSolicitationSort,
} from '@zro/pix-zro-pay/interface';

class GetAllCashOutSolicitationParams extends PaginationParams {
  @ApiProperty({
    description: 'Page sort attribute.',
    enum: GetAllCashOutSolicitationSort,
  })
  @IsOptional()
  @Sort(GetAllCashOutSolicitationSort)
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
}

class GetAllCashOutSolicitationRestResponseItem {
  @ApiProperty({
    description: 'Company name.',
    example: 'Company',
  })
  company_name: string;

  @ApiProperty({
    description: 'Value cents.',
    example: 100,
  })
  value_cents: number;

  @ApiProperty({
    description: 'Payment Date.',
    example: new Date(),
  })
  payment_date: Date;

  @ApiProperty({
    description: 'Status payment.',
    example: CashOutSolicitationStatus.PENDING,
  })
  status: CashOutSolicitationStatus;

  constructor(props: GetAllCashOutSolicitationResponseItem) {
    this.company_name = props.companyName;
    this.payment_date = props.paymentDate;
    this.status = props.status;
    this.value_cents = props.valueCents;
  }
}

class GetAllCashOutSolicitationRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'GetAllCashOutSolicitation data.',
    type: [GetAllCashOutSolicitationRestResponseItem],
  })
  data!: GetAllCashOutSolicitationRestResponseItem[];

  constructor(props: GetAllCashOutSolicitationResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllCashOutSolicitationRestResponseItem(item),
    );
  }
}

/**
 * RequestedPayments controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Transactions')
@ApiBearerAuth()
@Controller('pix/transactions/cashout-solicitation')
export class GetAllCashOutSolicitationRestController {
  /**
   * get all cashout solicitation endpoint.
   */
  @ApiOperation({
    summary: 'List cashout solicitation.',
    description: 'Get a list of  cashout solicitation.',
  })
  @ApiOkResponse({
    description: 'The cashout solicitation returned successfully.',
    type: GetAllCashOutSolicitationRestResponse,
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
    @AuthCompanyParam() company: AuthCompany,
    @Query() query: GetAllCashOutSolicitationParams,
    @KafkaServiceParam(GetAllCashOutSolicitationServiceKafka)
    createService: GetAllCashOutSolicitationServiceKafka,
    @LoggerParam(GetAllCashOutSolicitationRestController)
    logger: Logger,
  ): Promise<GetAllCashOutSolicitationRestResponse> {
    // GetAll payload.
    const payload: GetAllCashOutSolicitationRequest = {
      createdAtPeriodStart: query.created_at_period_start,
      createdAtPeriodEnd: query.created_at_period_end,

      // Sort query
      page: query.page,
      pageSize: query.size,
      sort: query.sort,
      order: query.order,
    };

    logger.debug('GetAll requested payments.', { company, payload });

    // Call get all payment service.
    const result = await createService.execute(payload);

    logger.debug('RequestedPayments found.', { result });

    const response = new GetAllCashOutSolicitationRestResponse(result);

    return response;
  }
}
