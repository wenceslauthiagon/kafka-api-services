import {
  GetSystemByNameService,
  GetProviderByIdService,
  CreateCryptoRemittanceService,
  CreateCryptoOrderService,
  GetCryptoOrderByIdService,
  GetCryptoRemittanceByIdService,
  GetRemittanceByIdService,
} from '@zro/otc-bot/application';

export type OtcService = GetProviderByIdService &
  CreateCryptoRemittanceService &
  CreateCryptoOrderService &
  GetSystemByNameService &
  GetCryptoOrderByIdService &
  GetCryptoRemittanceByIdService &
  GetRemittanceByIdService;
