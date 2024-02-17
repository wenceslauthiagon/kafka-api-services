import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { Wallet } from '@zro/operations/domain';
import { UserWithdrawSettingRequest } from '@zro/compliance/domain';
import {
  UserWithdrawSetting,
  UserWithdrawSettingEntity,
} from '@zro/utils/domain';
import { UtilService } from '@zro/compliance/application';
import {
  CreateUserWithdrawSettingServiceKafka,
  GetAllUserWithdrawSettingServiceKafka,
} from '@zro/utils/infrastructure';
import {
  CreateUserWithdrawSettingRequest,
  GetAllUserWithdrawSettingRequest,
} from '@zro/utils/interface';

/**
 * Util microservice
 */
export class UtilServiceKafka implements UtilService {
  static _services: any[] = [
    CreateUserWithdrawSettingServiceKafka,
    GetAllUserWithdrawSettingServiceKafka,
  ];

  private readonly createUserWithdrawSettingService: CreateUserWithdrawSettingServiceKafka;
  private readonly getAllByWalletUserWithdrawSettingService: GetAllUserWithdrawSettingServiceKafka;

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
    this.logger = logger.child({ context: UtilServiceKafka.name });

    this.createUserWithdrawSettingService =
      new CreateUserWithdrawSettingServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );

    this.getAllByWalletUserWithdrawSettingService =
      new GetAllUserWithdrawSettingServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );
  }

  /**
   * Create a user withdraw setting.
   * @param request.
   * @returns The withdraw setting created.
   */
  async createUserWithdrawSetting(
    userWithdrawSettingRequest: UserWithdrawSettingRequest,
  ): Promise<UserWithdrawSetting> {
    const request: CreateUserWithdrawSettingRequest = {
      id: userWithdrawSettingRequest.id,
      type: userWithdrawSettingRequest.type,
      balance: userWithdrawSettingRequest.balance,
      day: userWithdrawSettingRequest.day,
      weekDay: userWithdrawSettingRequest.weekDay,
      walletId: userWithdrawSettingRequest.wallet.uuid,
      transactionTypeTag: userWithdrawSettingRequest.transactionType.tag,
      pixKey: userWithdrawSettingRequest.pixKey.key,
      pixKeyType: userWithdrawSettingRequest.pixKey.type,
      userId: userWithdrawSettingRequest.user.uuid,
    };

    const response =
      await this.createUserWithdrawSettingService.execute(request);

    if (!response) return null;

    return new UserWithdrawSettingEntity({ id: response.id });
  }

  /**
   * Get a user wallet setting.
   * @param wallet.
   * @returns The wallet setting.
   */
  async getAllByWalletUserWithdrawSetting(
    wallet: Wallet,
  ): Promise<UserWithdrawSetting[]> {
    const request: GetAllUserWithdrawSettingRequest = {
      walletId: wallet.uuid,
    };

    const response =
      await this.getAllByWalletUserWithdrawSettingService.execute(request);

    if (!response.data) return [];

    return response.data.map(
      (item) => new UserWithdrawSettingEntity({ id: item.id }),
    );
  }
}
