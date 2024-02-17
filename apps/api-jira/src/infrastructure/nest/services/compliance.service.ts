import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import {
  UserLimitRequest,
  UserWithdrawSettingRequest,
  WarningTransaction,
} from '@zro/compliance/domain';
import { ComplianceService } from '@zro/api-jira/application';
import {
  CloseUserLimitRequestServiceKafka,
  CloseUserWithdrawSettingRequestServiceKafka,
  CloseWarningTransactionServiceKafka,
} from '@zro/compliance/infrastructure';
import {
  CloseUserLimitRequest,
  CloseUserWithdrawSettingRequest,
  CloseWarningTransactionRequest,
} from '@zro/compliance/interface';

/**
 * Compliance microservice.
 */
export class ComplianceServiceKafka implements ComplianceService {
  static _services: any[] = [
    CloseUserLimitRequestServiceKafka,
    CloseWarningTransactionServiceKafka,
    CloseUserWithdrawSettingRequestServiceKafka,
  ];

  private readonly closeUserLimitRequestService: CloseUserLimitRequestServiceKafka;
  private readonly closeWarningTransactionService: CloseWarningTransactionServiceKafka;
  private readonly closeUserWithdrawSettingRequestService: CloseUserWithdrawSettingRequestServiceKafka;

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
    this.logger = logger.child({ context: ComplianceServiceKafka.name });

    this.closeUserLimitRequestService = new CloseUserLimitRequestServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.closeWarningTransactionService =
      new CloseWarningTransactionServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );

    this.closeUserWithdrawSettingRequestService =
      new CloseUserWithdrawSettingRequestServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );
  }

  async closeUserLimitRequest(request: UserLimitRequest): Promise<void> {
    const data = new CloseUserLimitRequest({
      id: request.id,
      analysisResult: request.analysisResult,
    });

    await this.closeUserLimitRequestService.execute(data);
  }

  async closeWarningTransaction(request: WarningTransaction): Promise<void> {
    const data = new CloseWarningTransactionRequest({
      operationId: request.operation.id,
      analysisResult: request.analysisResult,
      ...(request.analysisDetails && {
        analysisDetails: request.analysisDetails,
      }),
    });

    await this.closeWarningTransactionService.execute(data);
  }

  async closeUserWithdrawSettingRequest(
    request: UserWithdrawSettingRequest,
  ): Promise<void> {
    const data = new CloseUserWithdrawSettingRequest({
      id: request.id,
      analysisResult: request.analysisResult,
    });

    await this.closeUserWithdrawSettingRequestService.execute(data);
  }
}
