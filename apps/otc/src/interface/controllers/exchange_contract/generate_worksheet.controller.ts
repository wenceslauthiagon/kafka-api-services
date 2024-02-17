import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  Pagination,
  IsIsoStringDateFormat,
  AutoValidator,
  Sort,
  PaginationSort,
} from '@zro/common';
import { File } from '@zro/storage/domain';
import {
  ExchangeContractRepository,
  GetExchangeContractFilter,
  TGetIntervalFilters,
  TGetTimestampFilters,
} from '@zro/otc/domain';
import {
  GenerateExchangeContractWorksheetUseCase as UseCase,
  StorageService,
} from '@zro/otc/application';

export enum GenerateExchangeContractWorksheetRequestSort {
  ID = 'id',
  CONTRACT_NUMBER = 'contract_number',
  VET_QUOTE = 'vet_quote',
  CONTRACT_QUOTE = 'contract_quote',
  TOTAL_AMOUNT = 'total_amount',
  CREATED_AT = 'created_at',
}

type TGenerateExchangeContractWorksheetRequest = Pagination &
  GetExchangeContractFilter;

export class GenerateExchangeContractWorksheetRequest
  extends AutoValidator
  implements TGenerateExchangeContractWorksheetRequest
{
  @IsOptional()
  @Sort(GenerateExchangeContractWorksheetRequestSort)
  sort?: PaginationSort;

  @MinLength(1)
  @MaxLength(50)
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsArray()
  exchangeContractIds?: string[];

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

  constructor(props: TGenerateExchangeContractWorksheetRequest) {
    super(props);
  }
}

type TGenerateExchangeContractWorksheetResponse = Pick<
  File,
  'id' | 'fileName' | 'createdAt'
>;

export class GenerateExchangeContractWorksheetResponse
  extends AutoValidator
  implements TGenerateExchangeContractWorksheetResponse
{
  @IsUUID(4)
  id: string;

  @IsString()
  fileName: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGenerateExchangeContractWorksheetResponse) {
    super(props);
  }
}

export class GenerateExchangeContractWorksheetController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    exchangeContractRepository: ExchangeContractRepository,
    storageService: StorageService,
    axiosInstance: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: GenerateExchangeContractWorksheetController.name,
    });
    this.usecase = new UseCase(
      this.logger,
      exchangeContractRepository,
      storageService,
      axiosInstance,
    );
  }

  async execute(
    request: GenerateExchangeContractWorksheetRequest,
  ): Promise<GenerateExchangeContractWorksheetResponse> {
    this.logger.debug('GetAll ExchangeContracts request.', { request });

    const {
      search,
      exchangeContractIds,
      vetQuote,
      contractQuote,
      totalAmount,
      createdAt,
    } = request;

    const filter: GetExchangeContractFilter = {
      ...(exchangeContractIds && { exchangeContractIds }),
      ...(vetQuote && { vetQuote }),
      ...(contractQuote && { contractQuote }),
      ...(totalAmount && { totalAmount }),
      ...(createdAt && { createdAt }),
    };

    const fileWorksheet = await this.usecase.execute(filter, search);

    const response = new GenerateExchangeContractWorksheetResponse({
      id: fileWorksheet.id,
      fileName: fileWorksheet.fileName,
      createdAt: fileWorksheet.createdAt,
    });

    this.logger.info('Upload Exchange Contracts FileWorksheet response.', {
      fileWorksheet: response,
    });

    return response;
  }
}
