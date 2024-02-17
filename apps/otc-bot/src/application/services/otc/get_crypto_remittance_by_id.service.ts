import { CryptoRemittance } from '@zro/otc/domain';
import { GetCryptoRemittanceByIdRequest } from '@zro/otc/interface';

export type GetCryptoRemittanceByIdServiceRequest =
  GetCryptoRemittanceByIdRequest;

export interface GetCryptoRemittanceByIdService {
  getCryptoRemittanceById(
    request: GetCryptoRemittanceByIdServiceRequest,
  ): Promise<CryptoRemittance>;
}
