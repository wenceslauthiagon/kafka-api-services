import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import {
  PixFraudDetection,
  PixInfraction,
  PixRefund,
} from '@zro/pix-payments/domain';
import {
  PixPaymentService,
  PixInfractionResponse,
  PixFraudDetectionResponse,
  PixRefundResponse,
} from '@zro/api-jira/application';
import {
  OpenPixInfractionServiceKafka,
  InAnalysisPixInfractionServiceKafka,
  ClosePixInfractionServiceKafka,
  CreatePixInfractionServiceKafka,
  CancelPixInfractionServiceKafka,
  ClosePixRefundServiceKafka,
  CancelPixRefundServiceKafka,
  RegisterPixFraudDetectionServiceKafka,
  CancelPixFraudDetectionRegisteredServiceKafka,
} from '@zro/pix-payments/infrastructure';
import {
  CancelPixFraudDetectionRegisteredRequest,
  CancelPixInfractionRequest,
  CancelPixRefundRequest,
  ClosePixInfractionRequest,
  ClosePixRefundRequest,
  CreatePixInfractionRequest,
  InAnalysisPixInfractionRequest,
  OpenPixInfractionRequest,
  RegisterPixFraudDetectionRequest,
} from '@zro/pix-payments/interface';

/**
 * Pix payment microservice.
 */
export class PixPaymentServiceKafka implements PixPaymentService {
  static _services: any[] = [
    CreatePixInfractionServiceKafka,
    OpenPixInfractionServiceKafka,
    InAnalysisPixInfractionServiceKafka,
    ClosePixInfractionServiceKafka,
    CancelPixInfractionServiceKafka,
    ClosePixRefundServiceKafka,
    CancelPixRefundServiceKafka,
    RegisterPixFraudDetectionServiceKafka,
    CancelPixFraudDetectionRegisteredServiceKafka,
  ];

  private readonly createPixInfractionServiceKafka: CreatePixInfractionServiceKafka;
  private readonly openPixInfractionService: OpenPixInfractionServiceKafka;
  private readonly inAnalysisPixInfractionService: InAnalysisPixInfractionServiceKafka;
  private readonly closePixInfractionServiceKafka: ClosePixInfractionServiceKafka;
  private readonly cancelPixInfractionServiceKafka: CancelPixInfractionServiceKafka;
  private readonly closePixRefundServiceKafka: ClosePixRefundServiceKafka;
  private readonly cancelPixRefundServiceKafka: CancelPixRefundServiceKafka;
  private readonly registerPixFraudDetectionServiceKafka: RegisterPixFraudDetectionServiceKafka;
  private readonly cancelPixFraudDetectionRegisteredServiceKafka: CancelPixFraudDetectionRegisteredServiceKafka;

  /**
   * Default constructor.
   * @param requestId The request id.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: PixPaymentServiceKafka.name });

    this.createPixInfractionServiceKafka = new CreatePixInfractionServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.openPixInfractionService = new OpenPixInfractionServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.inAnalysisPixInfractionService =
      new InAnalysisPixInfractionServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );

    this.closePixInfractionServiceKafka = new ClosePixInfractionServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.cancelPixInfractionServiceKafka = new CancelPixInfractionServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.closePixRefundServiceKafka = new ClosePixRefundServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.cancelPixRefundServiceKafka = new CancelPixRefundServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.registerPixFraudDetectionServiceKafka =
      new RegisterPixFraudDetectionServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );

    this.cancelPixFraudDetectionRegisteredServiceKafka =
      new CancelPixFraudDetectionRegisteredServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );
  }

  async createPixInfraction(
    request: PixInfraction,
  ): Promise<PixInfractionResponse> {
    const data = new CreatePixInfractionRequest({
      id: request.id,
      issueId: request.issueId,
      operationId: request.operation.id,
      status: request.status,
      description: request.description,
      infractionType: request.infractionType,
    });

    const response = await this.createPixInfractionServiceKafka.execute(data);

    return {
      id: response.id,
      state: response.state,
    };
  }

  async openPixInfraction(
    payload: PixInfraction,
  ): Promise<PixInfractionResponse> {
    const data = new OpenPixInfractionRequest({
      issueId: payload.issueId,
      description: payload.description,
    });

    const response = await this.openPixInfractionService.execute(data);

    return {
      id: response.id,
      state: response.state,
    };
  }

  async inAnalysisPixInfraction(
    payload: PixInfraction,
  ): Promise<PixInfractionResponse> {
    const data = new InAnalysisPixInfractionRequest({
      issueId: payload.issueId,
      description: payload.description,
    });

    const response = await this.inAnalysisPixInfractionService.execute(data);

    return {
      id: response.id,
      state: response.state,
    };
  }

  async cancelPixInfraction(issueId: number): Promise<PixInfractionResponse> {
    const data = new CancelPixInfractionRequest({
      issueId,
    });

    const response = await this.cancelPixInfractionServiceKafka.execute(data);

    return {
      id: response.id,
      state: response.state,
    };
  }

  async closePixInfraction(
    request: PixInfraction,
  ): Promise<PixInfractionResponse> {
    const data = new ClosePixInfractionRequest({
      issueId: request.issueId,
      analysisDetails: request.analysisDetails,
      analysisResult: request.analysisResult,
    });

    const response = await this.closePixInfractionServiceKafka.execute(data);

    return {
      id: response.id,
      state: response.state,
    };
  }

  async closePixRefund(request: PixRefund): Promise<PixRefundResponse> {
    const data = new ClosePixRefundRequest({
      issueId: request.issueId,
      analysisDetails: request.analysisDetails,
    });

    const response = await this.closePixRefundServiceKafka.execute(data);

    return {
      id: response.id,
      state: response.state,
    };
  }

  async cancelPixRefund(request: PixRefund): Promise<PixRefundResponse> {
    const data = new CancelPixRefundRequest({
      issueId: request.issueId,
      ...(request.analysisDetails && {
        analysisDetails: request.analysisDetails,
      }),
      ...(request.rejectionReason && {
        rejectionReason: request.rejectionReason,
      }),
    });

    const response = await this.cancelPixRefundServiceKafka.execute(data);

    return {
      id: response.id,
      state: response.state,
    };
  }

  async registerPixFraudDetection(
    request: PixFraudDetection,
  ): Promise<PixFraudDetectionResponse> {
    const data = new RegisterPixFraudDetectionRequest({
      id: request.id,
      issueId: request.issueId,
      document: request.document,
      fraudType: request.fraudType,
      key: request.key,
    });

    const response =
      await this.registerPixFraudDetectionServiceKafka.execute(data);

    return {
      id: response.id,
      state: response.state,
    };
  }

  async cancelRegisteredPixFraudDetection(
    request: PixFraudDetection,
  ): Promise<PixFraudDetectionResponse> {
    const data = new CancelPixFraudDetectionRegisteredRequest({
      issueId: request.issueId,
    });

    const response =
      await this.cancelPixFraudDetectionRegisteredServiceKafka.execute(data);

    return {
      id: response.id,
      state: response.state,
    };
  }
}
