import { RemittanceExposureRule } from '@zro/otc/domain';

export type RemittanceExposureRuleEvent = Pick<RemittanceExposureRule, 'id'>;

export interface RemittanceExposureRuleEventEmitter {
  /**
   * Emit created event.
   * @param event Data.
   */
  createdRemittanceExposureRule: (event: RemittanceExposureRuleEvent) => void;

  /**
   * Emit updated event.
   * @param event Data.
   */
  updatedRemittanceExposureRule: (event: RemittanceExposureRuleEvent) => void;
}
