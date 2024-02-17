import { Logger } from 'winston';
import {
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  IsUUID,
  Min,
} from 'class-validator';
import {
  IsIsoStringDateFormat,
  AutoValidator,
  Pagination,
  PaginationSort,
  PaginationResponse,
  PaginationEntity,
  PaginationRequest,
  IsDateBeforeThan,
  IsDateAfterThan,
  Sort,
} from '@zro/common';
import {
  ExchangeQuotationRepository,
  ExchangeQuotation,
  ExchangeQuotationState,
  GetExchangeQuotationFilter,
} from '@zro/otc/domain';
import { GetAllExchangeQuotationUseCase as UseCase } from '@zro/otc/application';

export enum GetAllExchangeQuotationRequestSort {
  CREATED_AT = 'created_at',
}

type TGetAllExchangeQuotationRequest = Pagination & GetExchangeQuotationFilter;

export class GetAllExchangeQuotationRequest
  extends PaginationRequest
  implements TGetAllExchangeQuotationRequest
{
  @IsOptional()
  @Sort(GetAllExchangeQuotationRequestSort)
  sort?: PaginationSort;

  @IsOptional()
  @IsInt()
  @Min(0)
  quotation?: number;

  @IsOptional()
  @IsEnum(ExchangeQuotationState)
  state?: ExchangeQuotationState;

  @IsOptional()
  @IsUUID(4)
  solicitationPspId?: string;

  @IsOptional()
  @IsString()
  gatewayName?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtStart',
  })
  @IsDateBeforeThan('createdAtEnd', false, {
    message: 'createdAtStart must be before than createdAtEnd',
  })
  createdAtStart?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtEnd',
  })
  @IsDateAfterThan('createdAtStart', false, {
    message: 'createdAtEnd must be after than createdAtStart',
  })
  createdAtEnd?: Date;

  constructor(props: TGetAllExchangeQuotationRequest) {
    super(props);
  }
}

type TGetAllExchangeQuotationResponseItem = Pick<
  ExchangeQuotation,
  | 'quotation'
  | 'state'
  | 'amount'
  | 'amountExternalCurrency'
  | 'quotationPspId'
  | 'solicitationPspId'
  | 'gatewayName'
  | 'createdAt'
>;

export class GetAllExchangeQuotationResponseItem
  extends AutoValidator
  implements TGetAllExchangeQuotationResponseItem
{
  @IsInt()
  @Min(0)
  quotation: number;

  @IsEnum(ExchangeQuotationState)
  state: ExchangeQuotationState;

  @IsInt()
  @Min(0)
  amount: number;

  @IsInt()
  @Min(0)
  amountExternalCurrency: number;

  @IsString()
  gatewayName: string;

  @IsUUID(4)
  solicitationPspId: string;

  @IsString()
  quotationPspId: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetAllExchangeQuotationResponseItem) {
    super(props);
  }
}

export class GetAllExchangeQuotationResponse extends PaginationResponse<GetAllExchangeQuotationResponseItem> {}

export class GetAllExchangeQuotationController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    exchangeQuotationRepository: ExchangeQuotationRepository,
  ) {
    this.logger = logger.child({
      context: GetAllExchangeQuotationController.name,
    });

    this.usecase = new UseCase(this.logger, exchangeQuotationRepository);
  }

  async execute(
    request: GetAllExchangeQuotationRequest,
  ): Promise<GetAllExchangeQuotationResponse> {
    this.logger.debug('Get all exchange quotation request.', { request });

    const {
      order,
      page,
      pageSize,
      sort,
      quotation,
      state,
      gatewayName,
      solicitationPspId,
      createdAtStart,
      createdAtEnd,
    } = request;

    const pagination = new PaginationEntity({ order, page, pageSize, sort });
    const filter: GetExchangeQuotationFilter = {
      quotation,
      state,
      gatewayName,
      solicitationPspId,
      createdAtStart,
      createdAtEnd,
    };

    const results = await this.usecase.execute(pagination, filter);

    const data = results.data.map(
      (item) =>
        new GetAllExchangeQuotationResponseItem({
          quotation: item.quotation,
          state: item.state,
          amount: item.amount,
          amountExternalCurrency: item.amountExternalCurrency,
          gatewayName: item.gatewayName,
          quotationPspId: item.quotationPspId,
          solicitationPspId: item.solicitationPspId,
          createdAt: item.createdAt,
        }),
    );

    const response = new GetAllExchangeQuotationResponse({ ...results, data });

    this.logger.debug('Get all exchange quotation response.', {
      remittanceExposureRules: response,
    });

    return response;
  }
}
