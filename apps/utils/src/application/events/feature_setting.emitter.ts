import { FeatureSetting } from '@zro/utils/domain';

export type FeatureSettingEvent = Pick<FeatureSetting, 'id' | 'name' | 'state'>;

export interface FeatureSettingEventEmitter {
  /**
   * Emit update feature setting event.
   * @param event event to fire.
   */
  updateFeatureCreateExchangeQuotation: (event: FeatureSettingEvent) => void;
}
