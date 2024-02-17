import { Logger } from 'winston';
import {
  CreateReportUserPspRequest,
  CreateReportUserRepresentorPspRequest,
  CreateReportHolderPspRequest,
  CreateReportUserConfigPspRequest,
  CreateReportPaymentsAccountHolderPspRequest,
  CreateReportOperationPspRequest,
  ReportGateway,
  SendReportPspRequest,
} from '@zro/reports/application';
import {
  EguardianCreateReportUserGateway,
  EguardianCreateReportHolderGateway,
  EguardianCreateReportUserConfigGateway,
  EguardianCreateReportUserRepresentorGateway,
  EguardianCreateReportPaymentsAccountHolderGateway,
  EguardianCreateReportOperationGateway,
  EguardianSendReportGateway,
} from '@zro/e-guardian/infrastructure';

export class EguardianReportGateway implements ReportGateway {
  constructor(
    private logger: Logger,
    private readonly exportExternalDest: string,
  ) {
    this.logger = logger.child({ context: EguardianReportGateway.name });
  }

  async createReportUser(request: CreateReportUserPspRequest): Promise<void> {
    this.logger.debug('Create report user file request.', { request });

    const gateway = new EguardianCreateReportUserGateway(this.logger);

    return gateway.createReportUser(request);
  }

  async createReportHolder(
    request: CreateReportHolderPspRequest,
  ): Promise<void> {
    this.logger.debug('Create report holder file request.', { request });

    const gateway = new EguardianCreateReportHolderGateway(this.logger);

    return gateway.createReportHolder(request);
  }

  async createReportUserConfig(
    request: CreateReportUserConfigPspRequest,
  ): Promise<void> {
    this.logger.debug('Create report user config file request.', { request });

    const gateway = new EguardianCreateReportUserConfigGateway(this.logger);

    return gateway.createReportUserConfig(request);
  }

  async sendReport(request: SendReportPspRequest): Promise<void> {
    this.logger.debug('Send report file to PSP.', { request });

    const gateway = new EguardianSendReportGateway(
      this.logger,
      this.exportExternalDest,
    );

    return gateway.sendReport(request);
  }

  async createReportUserRepresentor(
    request: CreateReportUserRepresentorPspRequest,
  ): Promise<void> {
    this.logger.debug('Create report user representor file request.', {
      request,
    });

    const gateway = new EguardianCreateReportUserRepresentorGateway(
      this.logger,
    );

    return gateway.createReportUserRepresentor(request);
  }

  async createReportPaymentsAccountHolder(
    request: CreateReportPaymentsAccountHolderPspRequest,
  ): Promise<void> {
    this.logger.debug('Create report payments account holder file request.', {
      request,
    });

    const gateway = new EguardianCreateReportPaymentsAccountHolderGateway(
      this.logger,
    );

    return gateway.createReportPaymentsAccountHolder(request);
  }

  async createReportOperation(
    request: CreateReportOperationPspRequest,
  ): Promise<void> {
    this.logger.debug('Create report operation file request.', { request });

    const gateway = new EguardianCreateReportOperationGateway(this.logger);

    return gateway.createReportOperation(request);
  }
}
