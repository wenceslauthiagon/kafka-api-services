import { CryptoOrder } from '@zro/otc/domain';

export type CreateCryptoOrderServiceRequest = Pick<
  CryptoOrder,
  | 'id'
  | 'baseCurrency'
  | 'amount'
  | 'type'
  | 'side'
  | 'state'
  | 'system'
  | 'provider'
  | 'cryptoRemittance'
  | 'createdAt'
  | 'price'
  | 'stopPrice'
  | 'validUntil'
>;

export type CreateCryptoOrderServiceResponse = Pick<
  CryptoOrder,
  | 'id'
  | 'baseCurrency'
  | 'amount'
  | 'type'
  | 'side'
  | 'state'
  | 'system'
  | 'provider'
  | 'cryptoRemittance'
  | 'createdAt'
  | 'price'
  | 'stopPrice'
  | 'validUntil'
>;

export interface CreateCryptoOrderService {
  createCryptoOrder(
    request: CreateCryptoOrderServiceRequest,
  ): Promise<CreateCryptoOrderServiceResponse>;
}
