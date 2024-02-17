import { CryptoOrder } from '@zro/otc/domain';
import { GetCryptoOrderByIdRequest } from '@zro/otc/interface';

export type GetCryptoOrderByIdServiceRequest = GetCryptoOrderByIdRequest;

export interface GetCryptoOrderByIdService {
  getCryptoOrderById(
    request: GetCryptoOrderByIdServiceRequest,
  ): Promise<CryptoOrder>;
}
