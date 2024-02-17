import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { JdpiVerifyNotifyCreditPixStatementPspGateway } from '@zro/jdpi';
import {
  PixStatementGateway,
  VerifyNotifyCreditPixStatementPspRequest,
  VerifyNotifyCreditPixStatementPspResponse,
} from '@zro/api-jdpi/application';

export class JdpiPixStatementGateway implements PixStatementGateway {
  constructor(
    private logger: Logger,
    private jdpiPixStatement: AxiosInstance,
  ) {
    this.logger = logger.child({ context: JdpiPixStatementGateway.name });
  }

  async verifyNotifyCreditPixStatement(
    request: VerifyNotifyCreditPixStatementPspRequest,
  ): Promise<VerifyNotifyCreditPixStatementPspResponse> {
    this.logger.debug('Verify notify credit pix statement request.', {
      request,
    });

    const gateway = new JdpiVerifyNotifyCreditPixStatementPspGateway(
      this.logger,
      this.jdpiPixStatement,
    );

    return gateway.verifyNotifyCreditPixStatement(request);
  }
}
