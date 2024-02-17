import { System } from '@zro/otc/domain';

export type GetSystemByNameServiceRequest = Pick<Required<System>, 'name'>;

export type GetSystemByNameServiceResponse = Pick<
  Required<System>,
  'id' | 'name' | 'description' | 'createdAt'
>;

export interface GetSystemByNameService {
  getSystemByName(
    request: GetSystemByNameServiceRequest,
  ): Promise<GetSystemByNameServiceResponse>;
}
