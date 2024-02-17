import { Logger } from 'winston';
import { IsInt, IsNumber, IsPositive, IsString, Min } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { StreamPair, StreamQuotation } from '@zro/quotations/domain';
import {
  Currency,
  CurrencyEntity,
  OperationStreamQuotationEntity,
  OperationStreamQuotationRepository,
} from '@zro/operations/domain';
import { HandleCreateOperationStreamQuotationEventUseCase as UseCase } from '@zro/operations/application';

type THandleCreateOperationStreamQuotationEventRequest = {
  quoteCurrencySymbol: Currency['symbol'];
  quoteCurrencyId: Currency['id'];
  quoteCurrencyDecimal: Currency['decimal'];
  baseCurrencySymbol: Currency['symbol'];
  baseCurrencyId: Currency['id'];
  baseCurrencyDecimal: Currency['decimal'];
  provider: StreamQuotation['gatewayName'];
  priceBuy: StreamQuotation['buy'];
  priceSell: StreamQuotation['sell'];
  price: number;
  priority: StreamPair['priority'];
};

export class HandleCreateOperationStreamQuotationEventRequest
  extends AutoValidator
  implements THandleCreateOperationStreamQuotationEventRequest
{
  @IsString()
  quoteCurrencySymbol: Currency['symbol'];

  @IsInt()
  @IsPositive()
  quoteCurrencyId: Currency['id'];

  @IsInt()
  @Min(0)
  quoteCurrencyDecimal: Currency['decimal'];

  @IsString()
  baseCurrencySymbol: Currency['symbol'];

  @IsInt()
  @IsPositive()
  baseCurrencyId: Currency['id'];

  @IsInt()
  @Min(0)
  baseCurrencyDecimal: Currency['decimal'];

  @IsString()
  provider: StreamQuotation['gatewayName'];

  @IsInt()
  priority: StreamPair['priority'];

  @IsNumber()
  @IsPositive()
  price: StreamQuotation['buy'];

  @IsNumber()
  @IsPositive()
  priceBuy: StreamQuotation['buy'];

  @IsNumber()
  @IsPositive()
  priceSell: StreamQuotation['sell'];

  constructor(props: THandleCreateOperationStreamQuotationEventRequest) {
    super(props);
  }
}

export class HandleCreateOperationStreamQuotationEventController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    operationStreamQuotationRepository: OperationStreamQuotationRepository,
  ) {
    this.logger = logger.child({
      context: HandleCreateOperationStreamQuotationEventController.name,
    });

    this.usecase = new UseCase(this.logger, operationStreamQuotationRepository);
  }

  async execute(
    request: HandleCreateOperationStreamQuotationEventRequest[],
  ): Promise<void> {
    const operationStreamQuotation = request.map(
      (req) =>
        new OperationStreamQuotationEntity({
          quoteCurrency: new CurrencyEntity({
            id: req.quoteCurrencyId,
            symbol: req.quoteCurrencySymbol,
            decimal: req.quoteCurrencyDecimal,
          }),
          baseCurrency: new CurrencyEntity({
            id: req.baseCurrencyId,
            symbol: req.baseCurrencySymbol,
            decimal: req.baseCurrencyDecimal,
          }),
          provider: req.provider,
          price: req.price,
          priceBuy: req.priceBuy,
          priceSell: req.priceSell,
          priority: req.priority,
        }),
    );

    this.logger.debug('Create operation stream quotation.', { request });

    await this.usecase.execute(operationStreamQuotation);
  }
}
