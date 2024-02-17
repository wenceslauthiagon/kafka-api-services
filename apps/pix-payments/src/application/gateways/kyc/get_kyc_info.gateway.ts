import { PersonType } from '@zro/users/domain';

export interface GetKycInfoRequest {
  document: string;
  personType: PersonType;
}

export interface GetKycInfoResponse {
  name: string;
  tradeName?: string;
  props: any;
}

export interface GetKycInfoGateway {
  getKycInfo(request: GetKycInfoRequest): Promise<GetKycInfoResponse>;
}
