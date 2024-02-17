import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  AutoValidator,
  IsDateAfterThan,
  IsDateBeforeThan,
  IsIsoStringDateFormat,
  getMoment,
} from '@zro/common';
import { File } from '@zro/storage/domain';
import { User, UserEntity } from '@zro/users/domain';
import { CurrencyEntity } from '@zro/operations/domain';
import {
  CryptoReportFormatType,
  CryptoReportRepository,
} from '@zro/otc/domain';
import {
  GetCryptoReportByCurrencyAndFormatUseCase as UseCase,
  StorageService,
  UserService,
  OperationService,
  HistoricalCryptoPriceGateway,
  QuotationService,
} from '@zro/otc/application';

type UserId = User['uuid'];

type TGetCryptoReportByCurrencyAndFormatRequest = {
  userId: UserId;
  format: CryptoReportFormatType;
  currencySymbol: string;
  createdAtStart?: Date;
  createdAtEnd?: Date;
};

export class GetCryptoReportByCurrencyAndFormatRequest
  extends AutoValidator
  implements TGetCryptoReportByCurrencyAndFormatRequest
{
  @IsUUID(4)
  userId: UserId;

  @IsEnum(CryptoReportFormatType)
  format: CryptoReportFormatType;

  @IsString()
  @MaxLength(255)
  currencySymbol: string;

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

  constructor(props: TGetCryptoReportByCurrencyAndFormatRequest) {
    super(props);
  }
}

type TGetCryptoReportByCurrencyAndFormatResponse = Pick<
  File,
  'id' | 'fileName' | 'createdAt'
>;

export class GetCryptoReportByCurrencyAndFormatResponse
  extends AutoValidator
  implements TGetCryptoReportByCurrencyAndFormatResponse
{
  @IsUUID(4)
  id: string;

  @IsString()
  fileName: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetCryptoReportByCurrencyAndFormatResponse) {
    super(props);
  }
}

export class GetCryptoReportByCurrencyAndFormatController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    readonly storageService: StorageService,
    readonly axiosInstance: AxiosInstance,
    readonly userService: UserService,
    readonly operationService: OperationService,
    readonly quotationService: QuotationService,
    readonly cryptoReportRepository: CryptoReportRepository,
    readonly historicalCryptoPriceGateway: HistoricalCryptoPriceGateway,
    readonly zrobankLogoUrl: string,
  ) {
    this.logger = logger.child({
      context: GetCryptoReportByCurrencyAndFormatController.name,
    });
    this.usecase = new UseCase(
      this.logger,
      storageService,
      axiosInstance,
      userService,
      operationService,
      quotationService,
      cryptoReportRepository,
      historicalCryptoPriceGateway,
      zrobankLogoUrl,
    );
  }

  async execute(
    request: GetCryptoReportByCurrencyAndFormatRequest,
  ): Promise<GetCryptoReportByCurrencyAndFormatResponse> {
    this.logger.debug(
      'Get crypto report by currency symbol and format request.',
      { request },
    );

    const { userId, currencySymbol, format, createdAtStart, createdAtEnd } =
      request;

    const user = new UserEntity({ uuid: userId });

    const currency = new CurrencyEntity({ symbol: currencySymbol });

    // If date range is not provided, get 1 year range from today.
    const createdAtStartFormatted = createdAtStart
      ? getMoment(createdAtStart).toDate()
      : getMoment().subtract(1, 'year').toDate();

    const createdAtEndFormatted = createdAtEnd
      ? getMoment(createdAtEnd).toDate()
      : getMoment().toDate();

    const cryptoReport = await this.usecase.execute(
      user,
      currency,
      format,
      createdAtStartFormatted,
      createdAtEndFormatted,
    );

    if (!cryptoReport) return null;

    const response = new GetCryptoReportByCurrencyAndFormatResponse({
      id: cryptoReport.id,
      fileName: cryptoReport.fileName,
      createdAt: cryptoReport.createdAt,
    });

    this.logger.debug(
      'Get crypto report by currency symbol and format response.',
      { response },
    );

    return response;
  }
}
