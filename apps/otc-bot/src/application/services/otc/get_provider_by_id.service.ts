import { Provider } from '@zro/otc/domain';

export type GetProviderByIdServiceRequest = Pick<Required<Provider>, 'id'>;

export type GetProviderByIdServiceResponse = Pick<
  Required<Provider>,
  'id' | 'name' | 'description' | 'createdAt'
>;

export interface GetProviderByIdService {
  getProviderById(
    request: GetProviderByIdServiceRequest,
  ): Promise<GetProviderByIdServiceResponse>;
}
