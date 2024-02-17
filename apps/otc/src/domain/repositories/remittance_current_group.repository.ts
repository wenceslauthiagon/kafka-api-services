import { Currency } from '@zro/operations/domain';
import {
  Provider,
  RemittanceCurrentGroup,
  SettlementDateCode,
  System,
} from '@zro/otc/domain';

export interface RemittanceCurrentGroupRepository {
  /**
   * CreateOrUpdate crypto remittance current group.
   *
   * @param remittanceCurrentGroup New RemittanceCurrentGroup.
   * @returns Created or Updated RemittanceCurrentGroup.
   */
  createOrUpdate: (
    remittanceCurrentGroup: RemittanceCurrentGroup,
  ) => Promise<void>;

  /**
   * Get current group by currency,system, provider, sendDate and receiveDate.
   * @param currency Currency.
   * @param system System.
   * @param provider Provider.
   * @param sendDateCode Send date code.
   * @param receiveDateCode Receive date code.
   * @returns RemittanceCurrentGroup found or null otherwise.
   */
  getByCurrencySystemProviderSendDateCodeAndReceiveDateCode: (
    currency: Currency,
    system: System,
    provider: Provider,
    sendDateCode: SettlementDateCode,
    receiveDateCode: SettlementDateCode,
  ) => Promise<RemittanceCurrentGroup>;
}
