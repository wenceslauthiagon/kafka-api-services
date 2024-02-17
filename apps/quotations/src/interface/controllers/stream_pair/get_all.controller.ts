import { Logger } from 'winston';
import {
  IsArray,
  isBoolean,
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  AutoValidator,
  Pagination,
  PaginationEntity,
  PaginationRequest,
  PaginationResponse,
  PaginationSort,
  Sort,
} from '@zro/common';
import { Currency } from '@zro/operations/domain';
import {
  StreamPair,
  GetStreamPairFilter,
  StreamPairRepository,
} from '@zro/quotations/domain';
import { GetAllStreamPairUseCase } from '@zro/quotations/application';

export enum GetAllStreamPairRequestSort {
  ID = 'id',
  CREATED_AT = 'created_at',
}

type TGetAllStreamPairRequest = Pagination & GetStreamPairFilter;

export class GetAllStreamPairRequest
  extends PaginationRequest
  implements TGetAllStreamPairRequest
{
  @IsOptional()
  @Sort(GetAllStreamPairRequestSort)
  sort?: PaginationSort;

  @IsOptional()
  @IsBoolean()
  active?: GetStreamPairFilter['active'];

  constructor(props: TGetAllStreamPairRequest) {
    super(props);
  }
}

type TGetAllStreamPairResponseItem = Partial<StreamPair>;

export class GetAllStreamPairResponseItem
  extends AutoValidator
  implements TGetAllStreamPairResponseItem
{
  @IsUUID(4)
  id: string;

  @IsObject()
  baseCurrency: Currency;

  @IsObject()
  quoteCurrency: Currency;

  @IsNumber()
  priority: number;

  @IsString()
  gatewayName: string;

  @IsBoolean()
  active: boolean;

  @IsArray()
  @IsOptional()
  composedBy?: StreamPair[];

  constructor(props: TGetAllStreamPairResponseItem) {
    super(props);
  }
}

export class GetAllStreamPairResponse extends PaginationResponse<GetAllStreamPairResponseItem> {}

export class GetAllStreamPairController {
  private readonly usecase: GetAllStreamPairUseCase;

  constructor(
    private readonly logger: Logger,
    streamPairRepository: StreamPairRepository,
  ) {
    this.logger = logger.child({ context: GetAllStreamPairController.name });
    this.usecase = new GetAllStreamPairUseCase(logger, streamPairRepository);
  }

  async execute(
    request: GetAllStreamPairRequest,
  ): Promise<GetAllStreamPairResponse> {
    this.logger.debug('Get streamPairs request.', { request });

    const { order, page, pageSize, sort, active } = request;

    const pagination = new PaginationEntity({ order, page, pageSize, sort });

    const filter: GetStreamPairFilter = {
      ...(isBoolean(active) && { active }),
    };

    const results = await this.usecase.execute(pagination, filter);

    const data = results.data.map(
      (streamPair) =>
        new GetAllStreamPairResponseItem({
          id: streamPair.id,
          baseCurrency: streamPair.baseCurrency,
          quoteCurrency: streamPair.quoteCurrency,
          priority: streamPair.priority,
          gatewayName: streamPair.gatewayName,
          active: streamPair.active,
          composedBy: streamPair.composedBy,
        }),
    );

    const response = new GetAllStreamPairResponse({ ...results, data });

    this.logger.debug('Get all streamPairs response.', {
      streamPairs: response,
    });

    return response;
  }
}
