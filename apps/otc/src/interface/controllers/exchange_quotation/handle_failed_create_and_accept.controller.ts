import { Logger } from 'winston';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import {
  Provider,
  Remittance,
  RemittanceRepository,
  System,
} from '@zro/otc/domain';
import { HandleFailedCreateAndAcceptExchangeQuotationEventUseCase } from '@zro/otc/application';

type THandleFailedCreateAndAcceptExchangeQuotationEventRequest = Pick<
  Remittance,
  'sendDate' | 'receiveDate'
> & {
  remittanceIds: Remittance['id'][];
  currencyTag: Currency['tag'];
  providerId?: Provider['id'];
  systemId?: System['id'];
};

export class HandleFailedCreateAndAcceptExchangeQuotationEventRequest
  extends AutoValidator
  implements THandleFailedCreateAndAcceptExchangeQuotationEventRequest
{
  @IsArray()
  @IsUUID(4, { each: true })
  remittanceIds: Remittance['id'][];

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format sendDate',
  })
  sendDate: Remittance['sendDate'];

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format receiveDate',
  })
  receiveDate: Remittance['receiveDate'];

  @IsString()
  @MaxLength(255)
  currencyTag: Currency['tag'];

  @IsUUID(4)
  @IsOptional()
  providerId?: Provider['id'];

  @IsUUID(4)
  @IsOptional()
  systemId?: System['id'];

  constructor(
    props: THandleFailedCreateAndAcceptExchangeQuotationEventRequest,
  ) {
    super(props);
  }
}

export class HandleFailedCreateAndAcceptExchangeQuotationEventController {
  private usecase: HandleFailedCreateAndAcceptExchangeQuotationEventUseCase;

  constructor(
    private logger: Logger,
    remittanceRepository: RemittanceRepository,
  ) {
    this.logger = logger.child({
      context: HandleFailedCreateAndAcceptExchangeQuotationEventController.name,
    });
    this.usecase = new HandleFailedCreateAndAcceptExchangeQuotationEventUseCase(
      logger,
      remittanceRepository,
    );
  }

  async execute(
    request: HandleFailedCreateAndAcceptExchangeQuotationEventRequest,
  ): Promise<void> {
    this.logger.debug(
      'Handle failed create and accept exchange quotation request.',
      { request },
    );

    const { remittanceIds, sendDate, receiveDate, currencyTag } = request;

    await this.usecase.execute(
      remittanceIds,
      sendDate,
      receiveDate,
      currencyTag,
    );
  }
}
