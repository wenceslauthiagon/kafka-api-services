import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { BankGateway, GetAllBankPspResponse } from '@zro/banking/application';
import { JdpiGetAllBankPspGateway } from './get_all_bank.gateway';

export class JdpiBankGateway implements BankGateway {
  constructor(
    private logger: Logger,
    private jdpiBank: AxiosInstance,
  ) {
    this.logger = logger.child({ context: JdpiBankGateway.name });
  }

  async getAllBank(): Promise<GetAllBankPspResponse[]> {
    this.logger.debug('Get all bank request.');

    const gateway = new JdpiGetAllBankPspGateway(this.logger, this.jdpiBank);

    return gateway.getAllBank();
  }
}
