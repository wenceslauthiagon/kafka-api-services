import { Currency } from '@zro/operations/domain';
import {
  Provider,
  RemittanceOrderCurrentGroup,
  SettlementDateCode,
  System,
} from '@zro/otc/domain';

export interface RemittanceOrderCurrentGroupRepository {
  /**
   * CreateOrUpdate crypto remittance current group.
   *
   * @param remittanceOrderCurrentGroup New RemittanceOrderCurrentGroup.
   * @returns Created or Updated RemittanceOrderCurrentGroup.
   */
  createOrUpdate: (
    remittanceOrderCurrentGroup: RemittanceOrderCurrentGroup,
  ) => Promise<void>;

  /**
   * Get current group by currency,system, provider, sendDate and receiveDate.
   * @param currency Currency.
   * @param system System.
   * @param provider Provider.
   * @param sendDateCode Send date code.
   * @param receiveDateCode Receive date code.
   * @returns RemittanceOrderCurrentGroup found or null otherwise.
   */
  getByCurrencySystemProviderSendDateCodeAndReceiveDateCode: (
    currency: Currency,
    system: System,
    provider: Provider,
    sendDateCode: SettlementDateCode,
    receiveDateDateCode: SettlementDateCode,
  ) => Promise<RemittanceOrderCurrentGroup>;
}
