import { Logger } from 'winston';
import { IsEnum } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { ExchangeQuotationRepository } from '@zro/otc/domain';
import {
  ExchangeQuotationGateway,
  HandleRejectExchangeQuotationEventUseCase,
  UtilService,
} from '@zro/otc/application';
import { FeatureSettingEvent } from '@zro/utils/application';
import { FeatureSettingName } from '@zro/utils/domain';

type THandleRejectExchangeQuotationEventRequest = Pick<
  FeatureSettingEvent,
  'name'
>;

export class HandleRejectExchangeQuotationEventRequest
  extends AutoValidator
  implements THandleRejectExchangeQuotationEventRequest
{
  @IsEnum(FeatureSettingName)
  name: FeatureSettingName;

  constructor(props: THandleRejectExchangeQuotationEventRequest) {
    super(props);
  }
}

export class HandleRejectExchangeQuotationEventController {
  private usecase: HandleRejectExchangeQuotationEventUseCase;

  constructor(
    private logger: Logger,
    pspGateway: ExchangeQuotationGateway,
    exchangeQuotationRepository: ExchangeQuotationRepository,
    utilService: UtilService,
  ) {
    this.logger = logger.child({
      context: HandleRejectExchangeQuotationEventController.name,
    });
    this.usecase = new HandleRejectExchangeQuotationEventUseCase(
      logger,
      pspGateway,
      exchangeQuotationRepository,
      utilService,
    );
  }

  async execute(
    request: HandleRejectExchangeQuotationEventRequest,
  ): Promise<void> {
    this.logger.debug(
      'Reject exchange quotation when feature setting was deactivate.',
      { request },
    );

    const { name } = request;

    await this.usecase.execute(name);
  }
}
