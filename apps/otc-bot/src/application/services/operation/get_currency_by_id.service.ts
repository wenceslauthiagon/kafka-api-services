import { Currency } from '@zro/operations/domain';

export type GetCurrencyByIdServiceRequest = Pick<Required<Currency>, 'id'>;

export type GetCurrencyByIdServiceResponse = Pick<
  Required<Currency>,
  'id' | 'symbol' | 'decimal' | 'state' | 'symbolAlign' | 'title' | 'type'
>;

export interface GetCurrencyByIdService {
  getCurrencyById(
    request: GetCurrencyByIdServiceRequest,
  ): Promise<GetCurrencyByIdServiceResponse>;
}
