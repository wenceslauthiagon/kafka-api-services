import { FeatureSetting, FeatureSettingName } from '@zro/utils/domain';

export interface FeatureSettingRepository {
  /**
   * Create feature setting.
   * @param featureSetting Feature Setting object.
   * @returns Feature Setting created.
   */
  create: (featureSetting: FeatureSetting) => Promise<FeatureSetting>;

  /**
   * Update feature setting.
   * @param featureSetting Feature Setting object.
   * @returns Feature Setting created.
   */
  update: (featureSetting: FeatureSetting) => Promise<FeatureSetting>;

  /**
   * Get feature setting by name.
   * @param name Feature Setting name.
   * @returns Feature Setting found or null otherwise.
   */
  getByName: (name: FeatureSettingName) => Promise<FeatureSetting>;

  /**
   * Get feature setting by id.
   * @param id Feature Setting id.
   * @returns Feature Setting found or null otherwise.
   */
  getById: (id: string) => Promise<FeatureSetting>;
}
