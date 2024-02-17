import { Remittance } from '@zro/otc/domain';
import { GetRemittanceByIdRequest } from '@zro/otc/interface';

export type GetRemittanceByIdServiceRequest = GetRemittanceByIdRequest;

export interface GetRemittanceByIdService {
  getRemittanceById(
    request: GetRemittanceByIdServiceRequest,
  ): Promise<Remittance>;
}
