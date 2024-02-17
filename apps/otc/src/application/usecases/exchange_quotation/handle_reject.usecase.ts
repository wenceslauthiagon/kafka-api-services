import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  RejectExchangeQuotationRequest,
  ExchangeQuotationGateway,
  UtilService,
} from '@zro/otc/application';
import {
  ExchangeQuotationRepository,
  ExchangeQuotationState,
} from '@zro/otc/domain';
import {
  FeatureSetting,
  FeatureSettingName,
  FeatureSettingState,
} from '@zro/utils/domain';

export class HandleRejectExchangeQuotationEventUseCase {
  private logger: Logger;
  constructor(
    logger: Logger,
    private readonly pspGateway: ExchangeQuotationGateway,
    private readonly exchangeQuotationRepository: ExchangeQuotationRepository,
    private readonly utilService: UtilService,
  ) {
    this.logger = logger.child({
      context: HandleRejectExchangeQuotationEventUseCase.name,
    });
  }

  async execute(name: FeatureSetting['name']): Promise<void> {
    if (!name) {
      throw new MissingDataException(['Feature Create Exchange Name']);
    }

    const featureSetting = await this.utilService.getFeatureSettingByName(name);

    this.logger.debug('Feature setting found.', { featureSetting });
    // Just reject if feature was deactivated
    if (
      featureSetting?.name === FeatureSettingName.CREATE_EXCHANGE_QUOTATION &&
      featureSetting?.state === FeatureSettingState.DEACTIVE
    ) {
      // Get all pending exchange quotations for reject in PSP
      const exchangeQuotations =
        await this.exchangeQuotationRepository.getAllByStateIn([
          ExchangeQuotationState.PENDING,
        ]);

      this.logger.debug(
        `Exchange quotations ${ExchangeQuotationState.PENDING} founds.`,
        {
          exchangeQuotations,
        },
      );

      // Reject in PSP
      for (const exchangeQuotation of exchangeQuotations) {
        const body: RejectExchangeQuotationRequest = {
          solicitationPspId: exchangeQuotation.solicitationPspId,
        };

        this.logger.debug('Call PSP for reject exchange quotation.', {
          solicitationPspId: exchangeQuotation.solicitationPspId,
        });

        await this.pspGateway.rejectExchangeQuotation(body);
        exchangeQuotation.state = ExchangeQuotationState.REJECTED;

        await this.exchangeQuotationRepository.update(exchangeQuotation);

        this.logger.debug(
          `Updated for state ${ExchangeQuotationState.REJECTED}.`,
          {
            solicitationPspId: exchangeQuotation.solicitationPspId,
          },
        );
      }
    }
  }
}
