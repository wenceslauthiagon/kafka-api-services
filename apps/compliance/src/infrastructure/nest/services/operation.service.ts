import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import {
  TransactionType,
  TransactionTypeEntity,
  UserWallet,
  UserWalletEntity,
  Wallet,
  WalletEntity,
} from '@zro/operations/domain';
import { User, UserEntity } from '@zro/users/domain';
import {
  OperationService,
  GetOperationByIdResponse,
} from '@zro/compliance/application';
import {
  GetActiveTransactionTypeByTagServiceKafka,
  GetOperationByIdServiceKafka,
  GetUserWalletByUserAndWalletServiceKafka,
  GetWalletByUuidServiceKafka,
} from '@zro/operations/infrastructure';

/**
 * Operation microservice
 */
export class OperationServiceKafka implements OperationService {
  static _services: any[] = [
    GetActiveTransactionTypeByTagServiceKafka,
    GetOperationByIdServiceKafka,
    GetUserWalletByUserAndWalletServiceKafka,
    GetWalletByUuidServiceKafka,
  ];

  private readonly getOperationByIdService: GetOperationByIdServiceKafka;
  private readonly getTransactionTypeByTagService: GetActiveTransactionTypeByTagServiceKafka;
  private readonly getUserWalletByUserAndWalletService: GetUserWalletByUserAndWalletServiceKafka;
  private readonly getWalletByUuidService: GetWalletByUuidServiceKafka;

  /**
   * Default constructor.
   * @param requestId The request id.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private readonly requestId: string,
    private logger: Logger,
    private kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: OperationServiceKafka.name });

    this.getOperationByIdService = new GetOperationByIdServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.getTransactionTypeByTagService =
      new GetActiveTransactionTypeByTagServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );

    this.getUserWalletByUserAndWalletService =
      new GetUserWalletByUserAndWalletServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );

    this.getWalletByUuidService = new GetWalletByUuidServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  /**
   * Get operation by id service.
   * @param id Operation id.
   * @returns Get a operation by id response.
   */
  async getOperationById(id: string): Promise<GetOperationByIdResponse> {
    return this.getOperationByIdService.execute({ id });
  }

  /**
   *  Get transaction type by tag.
   * @param tag transaction type tag.
   * @returns Transaction type found or null otherwise.
   */
  async getTransactionTypeByTag(tag: string): Promise<TransactionType> {
    const result = await this.getTransactionTypeByTagService.execute({ tag });

    const response = result && new TransactionTypeEntity(result);

    return response;
  }

  async getUserWalletByUserAndWallet(
    user: User,
    wallet: Wallet,
  ): Promise<UserWallet> {
    const result = await this.getUserWalletByUserAndWalletService.execute({
      userId: user.uuid,
      walletId: wallet.uuid,
    });

    const response =
      result &&
      new UserWalletEntity({
        id: result.id,
        user: new UserEntity({ uuid: result.userId }),
        wallet: new WalletEntity(result.wallet),
      });

    return response;
  }

  /**
   * Get wallet by uuid.
   * @param uuid wallet uuid.
   * @return Wallet if found or null otherwise.
   */
  async getWalletByUuid(uuid: string): Promise<Wallet> {
    const result = await this.getWalletByUuidService.execute({
      uuid,
    });

    const response = result && new WalletEntity(result);

    return response;
  }
}
