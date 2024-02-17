import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { NotifyConfirmBankingTed } from '@zro/api-topazio/domain';
import {
  BankingService,
  GetBankingTedByTransactionIdResponse,
  ForwardBankingTedResponse,
  RejectBankingTedResponse,
  ConfirmBankingTedResponse,
} from '@zro/api-topazio/application';
import {
  GetBankingTedByTransactionIdServiceKafka,
  ConfirmBankingTedServiceKafka,
  ForwardBankingTedServiceKafka,
  RejectBankingTedServiceKafka,
} from '@zro/banking/infrastructure';
import {
  GetBankingTedByTransactionIdRequest,
  ForwardBankingTedRequest,
  RejectBankingTedRequest,
  ConfirmBankingTedRequest,
} from '@zro/banking/interface';

/**
 * Banking microservice.
 */
export class BankingServiceKafka implements BankingService {
  static _services: any[] = [
    GetBankingTedByTransactionIdServiceKafka,
    ConfirmBankingTedServiceKafka,
    ForwardBankingTedServiceKafka,
    RejectBankingTedServiceKafka,
  ];

  private readonly getBankingTedByTransactionIdService: GetBankingTedByTransactionIdServiceKafka;
  private readonly confirmBankingTedService: ConfirmBankingTedServiceKafka;
  private readonly rejectBankingTedService: RejectBankingTedServiceKafka;
  private readonly forwardBankingTedService: ForwardBankingTedServiceKafka;

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
    this.logger = logger.child({ context: BankingServiceKafka.name });
    this.getBankingTedByTransactionIdService =
      new GetBankingTedByTransactionIdServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );
    this.confirmBankingTedService = new ConfirmBankingTedServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
    this.rejectBankingTedService = new RejectBankingTedServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
    this.forwardBankingTedService = new ForwardBankingTedServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  /**
   * Get bankingTed by transactionId.
   * @param transactionId The transactionId uuid.
   * @returns BankingTed if found or null otherwise.
   */
  async getBankingTedByTransactionId(
    transactionId: string,
  ): Promise<GetBankingTedByTransactionIdResponse> {
    const data = new GetBankingTedByTransactionIdRequest({ transactionId });

    const response =
      await this.getBankingTedByTransactionIdService.execute(data);

    if (!response) return null;

    return {
      id: response.id,
      state: response.state,
      createdAt: response.createdAt,
    };
  }

  /**
   * Create a confirm BankingTed.
   * @param payload NotifyConfirmBankingTed.
   * @returns BankingTed.
   */
  async confirmBankingTed(
    payload: NotifyConfirmBankingTed,
  ): Promise<ConfirmBankingTedResponse> {
    const data = new ConfirmBankingTedRequest({
      transactionId: payload.transactionId,
      beneficiaryDocument: payload.document,
      beneficiaryBankCode: payload.bankCode,
      beneficiaryAgency: payload.branch,
      beneficiaryAccount: payload.accountNumber,
      beneficiaryAccountType: payload.accountType,
      amount: payload.value,
    });

    const response = await this.confirmBankingTedService.execute(data);

    if (!response) return null;

    return {
      id: response.id,
      state: response.state,
      createdAt: response.createdAt,
    };
  }

  /**
   * Create a rejected BankingTed.
   * @param id Number.
   * @param code String.
   * @param message String.
   * @returns BankingTed.
   */
  async rejectBankingTed(
    id: number,
    code: string,
    message: string,
  ): Promise<RejectBankingTedResponse> {
    const data = new RejectBankingTedRequest({
      id,
      code,
      message,
    });

    const response = await this.rejectBankingTedService.execute(data);

    if (!response) return null;

    return {
      id: response.id,
      state: response.state,
      createdAt: response.createdAt,
    };
  }

  /**
   * Create a forward BankingTed.
   * @param id Number.
   * @returns BankingTed.
   */
  async forwardBankingTed(id: number): Promise<ForwardBankingTedResponse> {
    const data = new ForwardBankingTedRequest({
      id,
    });

    const response = await this.forwardBankingTedService.execute(data);

    if (!response) return null;

    return {
      id: response.id,
      state: response.state,
      createdAt: response.createdAt,
    };
  }
}
