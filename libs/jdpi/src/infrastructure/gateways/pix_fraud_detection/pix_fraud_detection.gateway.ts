import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import {
  CancelFraudDetectionPixFraudDetectionPspRequest,
  CancelFraudDetectionPixFraudDetectionPspResponse,
  CreateFraudDetectionPixFraudDetectionPspRequest,
  CreateFraudDetectionPixFraudDetectionPspResponse,
  GetByIdFraudDetectionPixFraudDetectionPspRequest,
  GetByIdFraudDetectionPixFraudDetectionPspResponse,
  GetAllFraudDetectionPixFraudDetectionPspRequest,
  GetAllFraudDetectionPixFraudDetectionPspResponse,
  PixFraudDetectionGateway,
} from '@zro/pix-payments/application';
import {
  JdpiCreateFraudDetectionPixFraudDetectionPspGateway,
  JdpiGetAllFraudDetectionPixFraudDetectionPspGateway,
  JdpiGetByIdFraudDetectionPixFraudDetectionPspGateway,
  JdpiCancelFraudDetectionPixFraudDetectionPspGateway,
} from '@zro/jdpi';

export class JdpiPixFraudDetectionGateway implements PixFraudDetectionGateway {
  constructor(
    private logger: Logger,
    private jdpiPixFraudDetection: AxiosInstance,
    private pspIspb: number,
  ) {
    this.logger = logger.child({ context: JdpiPixFraudDetectionGateway.name });
  }

  async createFraudDetection(
    request: CreateFraudDetectionPixFraudDetectionPspRequest,
  ): Promise<CreateFraudDetectionPixFraudDetectionPspResponse> {
    this.logger.debug('Create pix fraud detection request.', { request });

    const gateway = new JdpiCreateFraudDetectionPixFraudDetectionPspGateway(
      this.logger,
      this.jdpiPixFraudDetection,
      this.pspIspb,
    );

    return gateway.createFraudDetection(request);
  }

  async getAllFraudDetection(
    request: GetAllFraudDetectionPixFraudDetectionPspRequest,
  ): Promise<GetAllFraudDetectionPixFraudDetectionPspResponse> {
    this.logger.debug('Get all pix fraud detection request.', { request });

    const gateway = new JdpiGetAllFraudDetectionPixFraudDetectionPspGateway(
      this.logger,
      this.jdpiPixFraudDetection,
      this.pspIspb,
    );

    return gateway.getAllFraudDetection(request);
  }

  async getByIdFraudDetection(
    request: GetByIdFraudDetectionPixFraudDetectionPspRequest,
  ): Promise<GetByIdFraudDetectionPixFraudDetectionPspResponse> {
    this.logger.debug('Get by id pix fraud detection request.', { request });

    const gateway = new JdpiGetByIdFraudDetectionPixFraudDetectionPspGateway(
      this.logger,
      this.jdpiPixFraudDetection,
      this.pspIspb,
    );

    return gateway.getByIdFraudDetection(request);
  }

  async cancelFraudDetection(
    request: CancelFraudDetectionPixFraudDetectionPspRequest,
  ): Promise<CancelFraudDetectionPixFraudDetectionPspResponse> {
    this.logger.debug('Cancel pix fraud detection request.', { request });

    const gateway = new JdpiCancelFraudDetectionPixFraudDetectionPspGateway(
      this.logger,
      this.jdpiPixFraudDetection,
      this.pspIspb,
    );

    return gateway.cancelFraudDetection(request);
  }
}
