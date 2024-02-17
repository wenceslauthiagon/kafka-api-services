import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import {
  BankingTedGateway,
  CreateBankingTedPspRequest,
  CreateBankingTedPspResponse,
} from '@zro/banking/application';
import { TopazioCreateBankingTedPspGateway } from '@zro/topazio';

export class TopazioBankingTedGateway implements BankingTedGateway {
  constructor(
    private logger: Logger,
    private topazioBankingTed: AxiosInstance,
  ) {
    this.logger = logger.child({ context: TopazioBankingTedGateway.name });
  }

  async createBankingTed(
    request: CreateBankingTedPspRequest,
  ): Promise<CreateBankingTedPspResponse> {
    this.logger.debug('Create banking ted request.', { request });

    const gateway = new TopazioCreateBankingTedPspGateway(
      this.logger,
      this.topazioBankingTed,
    );

    return gateway.createBankingTed(request);
  }
}
