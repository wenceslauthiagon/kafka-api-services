import { Currency } from '@zro/operations/domain';
import {
  ExchangeQuotation,
  Provider,
  Remittance,
  System,
} from '@zro/otc/domain';

export type ExchangeQuotationEvent = {
  sendDate?: Remittance['sendDate'];
  receiveDate?: Remittance['receiveDate'];
  remittanceIds?: Remittance['id'][];
  currencyTag?: Currency['tag'];
  solicitationPspId?: ExchangeQuotation['solicitationPspId'];
  quotationPspId?: ExchangeQuotation['quotationPspId'];
  providerId?: Provider['id'];
  systemId?: System['id'];
};

export interface ExchangeQuotationEventEmitter {
  /**
   * Emit ready event.
   * @param event Data.
   */
  readyExchangeQuotation: (event: ExchangeQuotationEvent) => void;

  /**
   * Emit accept event.
   * @param event Data.
   */
  acceptExchangeQuotation: (event: ExchangeQuotationEvent) => void;

  /**
   * Emit approved event.
   * @param event Data.
   */
  approvedExchangeQuotation: (event: ExchangeQuotationEvent) => void;

  /**
   * Emit completed event.
   * @param event Data.
   */
  completedExchangeQuotation: (event: ExchangeQuotationEvent) => void;

  /**
   * Emit rejected event.
   * @param event Data.
   */
  rejectedExchangeQuotation: (event: ExchangeQuotationEvent) => void;

  /**
   * Emit canceled event.
   * @param event Data.
   */
  canceledExchangeQuotation: (event: ExchangeQuotationEvent) => void;
}
