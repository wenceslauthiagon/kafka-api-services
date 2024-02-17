import { Currency } from '@zro/operations/domain';

export interface DeleteCryptoRemittanceByIdRequest {
  id: string;
  baseCurrency: Currency;
  quoteCurrency: Currency;
}

export interface DeleteCryptoRemittanceByIdResponse {
  id: string;
}

export interface DeleteCryptoRemittanceByIdGateway {
  deleteCryptoRemittanceById(
    data: DeleteCryptoRemittanceByIdRequest,
  ): Promise<DeleteCryptoRemittanceByIdResponse>;
}
