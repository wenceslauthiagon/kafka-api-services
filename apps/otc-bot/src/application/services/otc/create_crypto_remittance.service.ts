import { CryptoRemittance } from '@zro/otc/domain';

export type CreateCryptoRemittanceServiceRequest = Pick<
  CryptoRemittance,
  | 'id'
  | 'baseCurrency'
  | 'quoteCurrency'
  | 'market'
  | 'amount'
  | 'type'
  | 'side'
  | 'price'
  | 'stopPrice'
  | 'validUntil'
  | 'provider'
  | 'providerOrderId'
  | 'providerName'
  | 'status'
  | 'executedPrice'
  | 'executedAmount'
  | 'fee'
>;

export interface CreateCryptoRemittanceService {
  createCryptoRemittance(
    request: CreateCryptoRemittanceServiceRequest,
  ): Promise<void>;
}
