import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { FeatureSetting, FeatureSettingRepository } from '@zro/utils/domain';

export class GetFeatureSettingByNameUseCase {
  constructor(
    private logger: Logger,
    private readonly featureSettingRepository: FeatureSettingRepository,
  ) {
    this.logger = logger.child({
      context: GetFeatureSettingByNameUseCase.name,
    });
  }

  /**
   * Get feature setting by name.
   *
   * @param name FeatureSetting name.
   * @returns The featureSetting found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(name: FeatureSetting['name']): Promise<FeatureSetting> {
    // Data input check
    if (!name) {
      throw new MissingDataException(['Setting Name']);
    }

    // Search featureSetting
    const featureSetting = await this.featureSettingRepository.getByName(name);

    this.logger.debug('FeatureSetting found.', { featureSetting });

    return featureSetting;
  }
}
