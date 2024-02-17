import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import {
  KycGateway,
  GetKycInfoRequest,
  GetKycInfoResponse,
} from '@zro/pix-payments/application';
import { TopazioGetKycInfoGateway } from '@zro/topazio';

export class TopazioKycGateway implements KycGateway {
  constructor(
    private logger: Logger,
    private topazioKyc: AxiosInstance,
  ) {
    this.logger = logger.child({ context: TopazioKycGateway.name });
  }

  async getKycInfo(request: GetKycInfoRequest): Promise<GetKycInfoResponse> {
    this.logger.debug('Get Kyc info request.', { request });

    const gateway = new TopazioGetKycInfoGateway(this.logger, this.topazioKyc);

    return gateway.getKycInfo(request);
  }
}
