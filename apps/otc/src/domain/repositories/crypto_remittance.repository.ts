import { CryptoRemittance } from '@zro/otc/domain';

export interface CryptoRemittanceRepository {
  create: (cryptoRemittance: CryptoRemittance) => Promise<CryptoRemittance>;
  update: (cryptoRemittance: CryptoRemittance) => Promise<CryptoRemittance>;
  getById: (id: string) => Promise<CryptoRemittance>;
}
