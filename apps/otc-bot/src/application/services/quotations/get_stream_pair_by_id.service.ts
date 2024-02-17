import { StreamPair } from '@zro/quotations/domain';

export type GetStreamPairByIdServiceRequest = Pick<Required<StreamPair>, 'id'>;

export type GetStreamPairByIdServiceResponse = Pick<
  Required<StreamPair>,
  | 'id'
  | 'baseCurrency'
  | 'quoteCurrency'
  | 'priority'
  | 'gatewayName'
  | 'composedBy'
  | 'active'
>;

export interface GetStreamPairByIdService {
  getStreamPairById(
    request: GetStreamPairByIdServiceRequest,
  ): Promise<GetStreamPairByIdServiceResponse>;
}
