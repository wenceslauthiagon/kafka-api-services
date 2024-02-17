import { Logger } from 'winston';
import { IsInt, IsPositive, IsString, MaxLength } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { CurrencyEntity } from '@zro/operations/domain';
import {
  GetCryptoPriceByCurrencyAndDateUseCase as UseCase,
  HistoricalCryptoPriceGateway,
  QuotationService,
} from '@zro/otc/application';

type TGetCryptoPriceByCurrencyAndDateRequest = {
  currencySymbol: string;
  date: Date;
};

export class GetCryptoPriceByCurrencyAndDateRequest
  extends AutoValidator
  implements TGetCryptoPriceByCurrencyAndDateRequest
{
  @IsString()
  @MaxLength(255)
  currencySymbol: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format date.',
  })
  date: Date;

  constructor(props: TGetCryptoPriceByCurrencyAndDateRequest) {
    super(props);
  }
}

type TGetCryptoPriceByCurrencyAndDateResponse = {
  estimatedPrice: number;
};

export class GetCryptoPriceByCurrencyAndDateResponse
  extends AutoValidator
  implements TGetCryptoPriceByCurrencyAndDateResponse
{
  @IsInt()
  @IsPositive()
  estimatedPrice: number;

  constructor(props: TGetCryptoPriceByCurrencyAndDateResponse) {
    super(props);
  }
}

export class GetCryptoPriceByCurrencyAndDateController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    private quotationService: QuotationService,
    private historicalCryptoPriceGateway: HistoricalCryptoPriceGateway,
  ) {
    this.logger = logger.child({
      context: GetCryptoPriceByCurrencyAndDateController.name,
    });
    this.usecase = new UseCase(
      this.logger,
      this.quotationService,
      this.historicalCryptoPriceGateway,
    );
  }

  async execute(
    request: GetCryptoPriceByCurrencyAndDateRequest,
  ): Promise<GetCryptoPriceByCurrencyAndDateResponse> {
    this.logger.debug('Get crypto price by currency symbol and date request.', {
      request,
    });

    const { currencySymbol, date } = request;

    const currency = new CurrencyEntity({ symbol: currencySymbol });

    const cryptoPrice = await this.usecase.execute(currency, date);

    if (!cryptoPrice) return null;

    const response = new GetCryptoPriceByCurrencyAndDateResponse({
      estimatedPrice: cryptoPrice,
    });

    this.logger.debug(
      'Get crypto price by currency symbol and date response.',
      {
        response,
      },
    );

    return response;
  }
}
