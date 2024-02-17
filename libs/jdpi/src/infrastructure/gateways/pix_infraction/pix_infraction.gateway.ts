import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import {
  CancelInfractionPixInfractionPspRequest,
  CancelInfractionPixInfractionPspResponse,
  CreateInfractionPixInfractionPspRequest,
  CreateInfractionPixInfractionPspResponse,
  CloseInfractionPixInfractionPspRequest,
  CloseInfractionPixInfractionPspResponse,
  PixInfractionGateway,
  GetInfractionPixInfractionPspResponse,
  GetInfractionPixInfractionPspRequest,
} from '@zro/pix-payments/application';
import {
  JdpiCancelInfractionPixInfractionPspGateway,
  JdpiCloseInfractionPixInfractionPspGateway,
  JdpiCreateInfractionPixInfractionPspGateway,
  JdpiGetInfractionPixInfractionPspGateway,
} from '@zro/jdpi';

export class JdpiPixInfractionGateway implements PixInfractionGateway {
  constructor(
    private logger: Logger,
    private jdpiPixInfraction: AxiosInstance,
    private pspIspb: number,
  ) {
    this.logger = logger.child({ context: JdpiPixInfractionGateway.name });
  }

  async getInfractions(
    request: GetInfractionPixInfractionPspRequest,
  ): Promise<GetInfractionPixInfractionPspResponse[]> {
    this.logger.debug('Get infraction report request.', { request });

    const gateway = new JdpiGetInfractionPixInfractionPspGateway(
      this.logger,
      this.jdpiPixInfraction,
      this.pspIspb,
    );

    return gateway.getInfractions(request);
  }

  async createInfraction(
    request: CreateInfractionPixInfractionPspRequest,
  ): Promise<CreateInfractionPixInfractionPspResponse> {
    this.logger.debug('Create infraction report request.', { request });

    const gateway = new JdpiCreateInfractionPixInfractionPspGateway(
      this.logger,
      this.jdpiPixInfraction,
      this.pspIspb,
    );

    return gateway.createInfraction(request);
  }

  async cancelInfraction(
    request: CancelInfractionPixInfractionPspRequest,
  ): Promise<CancelInfractionPixInfractionPspResponse> {
    this.logger.debug('Get cancel infraction report request.', { request });

    const gateway = new JdpiCancelInfractionPixInfractionPspGateway(
      this.logger,
      this.jdpiPixInfraction,
      this.pspIspb,
    );

    return gateway.cancelInfraction(request);
  }

  async closeInfraction(
    request: CloseInfractionPixInfractionPspRequest,
  ): Promise<CloseInfractionPixInfractionPspResponse> {
    this.logger.debug('Get close infraction report request.', { request });

    const gateway = new JdpiCloseInfractionPixInfractionPspGateway(
      this.logger,
      this.jdpiPixInfraction,
      this.pspIspb,
    );

    return gateway.closeInfraction(request);
  }
}
