import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import {
  AdminBankingService,
  GetAdminBankingTedByTransactionIdResponse,
  ForwardAdminBankingTedResponse,
  RejectAdminBankingTedResponse,
} from '@zro/api-topazio/application';
import {
  GetAdminBankingTedByTransactionIdServiceKafka,
  ForwardAdminBankingTedServiceKafka,
  RejectAdminBankingTedServiceKafka,
} from '@zro/banking/infrastructure';
import {
  GetAdminBankingTedByTransactionIdRequest,
  ForwardAdminBankingTedRequest,
  RejectAdminBankingTedRequest,
} from '@zro/banking/interface';

/**
 * Banking microservice.
 */
export class AdminBankingServiceKafka implements AdminBankingService {
  static _services: any[] = [
    GetAdminBankingTedByTransactionIdServiceKafka,
    ForwardAdminBankingTedServiceKafka,
    RejectAdminBankingTedServiceKafka,
  ];

  private readonly getAdminBankingTedByTransactionIdService: GetAdminBankingTedByTransactionIdServiceKafka;
  private readonly rejectAdminBankingTedService: RejectAdminBankingTedServiceKafka;
  private readonly forwardAdminBankingTedService: ForwardAdminBankingTedServiceKafka;

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
    this.logger = logger.child({ context: AdminBankingServiceKafka.name });
    this.getAdminBankingTedByTransactionIdService =
      new GetAdminBankingTedByTransactionIdServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );
    this.rejectAdminBankingTedService = new RejectAdminBankingTedServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
    this.forwardAdminBankingTedService = new ForwardAdminBankingTedServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  /**
   * Get bankingTed by transactionId.
   * @param transactionId The transactionId uuid.
   * @returns AdminBankingTed if found or null otherwise.
   */
  async getAdminBankingTedByTransactionId(
    transactionId: string,
  ): Promise<GetAdminBankingTedByTransactionIdResponse> {
    const data = new GetAdminBankingTedByTransactionIdRequest({
      transactionId,
    });

    const response =
      await this.getAdminBankingTedByTransactionIdService.execute(data);

    if (!response) return null;

    return {
      id: response.id,
      state: response.state,
      createdAt: response.createdAt,
    };
  }

  /**
   * Create a rejected AdminBankingTed.
   * @param id String.
   * @param code String.
   * @param message String.
   * @returns AdminBankingTed.
   */
  async rejectAdminBankingTed(
    id: string,
    code: string,
    message: string,
  ): Promise<RejectAdminBankingTedResponse> {
    const data = new RejectAdminBankingTedRequest({
      id,
      failureCode: code,
      failureMessage: message,
    });

    const response = await this.rejectAdminBankingTedService.execute(data);

    if (!response) return null;

    return {
      id: response.id,
      state: response.state,
      createdAt: response.createdAt,
    };
  }

  /**
   * Create a forward AdminBankingTed.
   * @param id String.
   * @returns AdminBankingTed.
   */
  async forwardAdminBankingTed(
    id: string,
  ): Promise<ForwardAdminBankingTedResponse> {
    const data = new ForwardAdminBankingTedRequest({
      id,
    });

    const response = await this.forwardAdminBankingTedService.execute(data);

    if (!response) return null;

    return {
      id: response.id,
      state: response.state,
      createdAt: response.createdAt,
    };
  }
}
