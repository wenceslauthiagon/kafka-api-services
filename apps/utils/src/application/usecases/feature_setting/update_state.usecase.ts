import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  FeatureSetting,
  FeatureSettingRepository,
  FeatureSettingName,
} from '@zro/utils/domain';
import {
  FeatureSettingNotFoundException,
  FeatureSettingEventEmitter,
} from '@zro/utils/application';

export class UpdateFeatureSettingStateUseCase {
  constructor(
    private logger: Logger,
    private readonly featureSettingRepository: FeatureSettingRepository,
    private readonly eventEmitter: FeatureSettingEventEmitter,
  ) {
    this.logger = logger.child({
      context: UpdateFeatureSettingStateUseCase.name,
    });
  }

  async execute(
    id: FeatureSetting['id'],
    state: FeatureSetting['state'],
  ): Promise<FeatureSetting> {
    // Data input check
    if (!id || !state) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!state ? ['state'] : []),
      ]);
    }

    // Search featureSetting
    const featureSetting = await this.featureSettingRepository.getById(id);

    this.logger.debug('FeatureSetting found.', { featureSetting });

    if (!featureSetting) {
      throw new FeatureSettingNotFoundException({ id });
    }

    // Check idempotency
    if (featureSetting.state === state) {
      return featureSetting;
    }

    featureSetting.state = state;

    await this.featureSettingRepository.update(featureSetting);

    if (featureSetting.name === FeatureSettingName.CREATE_EXCHANGE_QUOTATION) {
      this.eventEmitter.updateFeatureCreateExchangeQuotation(featureSetting);
    }

    return featureSetting;
  }
}
