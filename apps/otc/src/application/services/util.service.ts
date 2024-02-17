import { FeatureSetting, FeatureSettingName } from '@zro/utils/domain';

export interface UtilService {
  /**
   * Feature Setting.
   * @param name Feature Setting.
   * @returns Feature Setting found or null otherwise.
   */
  getFeatureSettingByName(name: FeatureSettingName): Promise<FeatureSetting>;
}
