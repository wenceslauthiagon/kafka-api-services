import { ExchangeContract } from '@zro/otc/domain';

export interface ExchangeContractEvent {
  id: string;
}

export interface ExchangeContractEventEmitter {
  /**
   * Call exchange contract microservice to emit exchange contract created.
   * @param remittance Data.
   */
  created: (exchangeContract: ExchangeContract) => void;
}
