import { Address } from '@zro/users/domain';

export type GetAddressByIdServiceRequest = Pick<Address, 'id' | 'user'>;
export type GetAddressByIdServiceResponse = Pick<
  Address,
  'id' | 'city' | 'street' | 'zipCode' | 'federativeUnit'
>;

export interface GetAddressByIdService {
  /**
   * Get address by id.
   * @param request The address.
   * @returns Address found.
   */
  getAddressById(
    request: GetAddressByIdServiceRequest,
  ): Promise<GetAddressByIdServiceResponse>;
}
