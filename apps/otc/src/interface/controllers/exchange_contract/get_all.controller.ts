import { Logger } from 'winston';
import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  Pagination,
  PaginationResponse,
  PaginationEntity,
  PaginationRequest,
  IsIsoStringDateFormat,
  AutoValidator,
  Sort,
  PaginationSort,
} from '@zro/common';
import {
  ExchangeContract,
  ExchangeContractRepository,
  GetExchangeContractFilter,
  TGetIntervalFilters,
  TGetTimestampFilters,
} from '@zro/otc/domain';
import { GetAllExchangeContractUseCase as UseCase } from '@zro/otc/application';

export enum GetAllExchangeContractRequestSort {
  ID = 'id',
  CONTRACT_NUMBER = 'contract_number',
  VET_QUOTE = 'vet_quote',
  CONTRACT_QUOTE = 'contract_quote',
  TOTAL_AMOUNT = 'total_amount',
  CREATED_AT = 'created_at',
}

type TGetAllExchangeContractRequest = Pagination & GetExchangeContractFilter;

export class GetAllExchangeContractRequest
  extends PaginationRequest
  implements TGetAllExchangeContractRequest
{
  @IsOptional()
  @Sort(GetAllExchangeContractRequestSort)
  sort?: PaginationSort;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsObject()
  vetQuote?: TGetIntervalFilters;

  @IsOptional()
  @IsObject()
  contractQuote?: TGetIntervalFilters;

  @IsOptional()
  @IsObject()
  totalAmount?: TGetIntervalFilters;

  @IsOptional()
  @IsObject()
  createdAt?: TGetTimestampFilters;

  constructor(props: TGetAllExchangeContractRequest) {
    super(props);
  }
}

type TGetAllExchangeContractResponseItem = ExchangeContract & {
  fileId: string;
};

export class GetAllExchangeContractResponseItem
  extends AutoValidator
  implements TGetAllExchangeContractResponseItem
{
  @IsUUID(4)
  id: string;

  @IsString()
  contractNumber: string;

  @IsNumber()
  vetQuote: number;

  @IsNumber()
  contractQuote: number;

  @IsNumber()
  totalAmount: number;

  @IsUUID(4)
  @IsOptional()
  fileId: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetAllExchangeContractResponseItem) {
    super(props);
  }
}

export class GetAllExchangeContractResponse extends PaginationResponse<GetAllExchangeContractResponseItem> {}

export class GetAllExchangeContractController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    ExchangeContractRepository: ExchangeContractRepository,
  ) {
    this.logger = logger.child({
      context: GetAllExchangeContractController.name,
    });
    this.usecase = new UseCase(this.logger, ExchangeContractRepository);
  }

  async execute(
    request: GetAllExchangeContractRequest,
  ): Promise<GetAllExchangeContractResponse> {
    this.logger.debug('Get all exchange contracts request.', { request });

    const {
      vetQuote,
      contractQuote,
      totalAmount,
      createdAt,
      search,
      order,
      page,
      pageSize,
      sort,
    } = request;

    const pagination = new PaginationEntity({ order, page, pageSize, sort });

    const filter: GetExchangeContractFilter = {
      ...(vetQuote && { vetQuote }),
      ...(contractQuote && { contractQuote }),
      ...(totalAmount && { totalAmount }),
      ...(createdAt && { createdAt }),
    };

    const exchangeContracts = await this.usecase.execute(
      pagination,
      filter,
      search,
    );

    const data = exchangeContracts.data.map(
      (exchangeContract) =>
        new GetAllExchangeContractResponseItem({
          id: exchangeContract.id,
          contractNumber: exchangeContract.contractNumber,
          vetQuote: exchangeContract.vetQuote,
          contractQuote: exchangeContract.contractQuote,
          totalAmount: exchangeContract.totalAmount,
          fileId: exchangeContract.file?.id ?? null,
          createdAt: exchangeContract.createdAt,
        }),
    );

    const response = new GetAllExchangeContractResponse({
      ...exchangeContracts,
      data,
    });

    this.logger.info('Get all exchange contracts response.', {
      ExchangeContracts: response,
    });

    return response;
  }
}
