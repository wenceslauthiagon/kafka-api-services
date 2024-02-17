import { CronJob } from 'cron';
import { v4 as uuidV4 } from 'uuid';
import {
  CRON_TASKS,
  CheckoutDatabaseRepository,
  CheckoutHistoricDatabaseRepository,
  CieloClientHttpService,
  CieloTransactionStatusEnum,
} from '@zro/cielo/infrastructure';
import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  CheckoutHistoric,
  CheckoutHistoricRepository,
  CheckoutRepository,
} from '@zro/cielo/domain';
import {
  InjectLogger,
  MissingEnvVarException,
  RedisService,
} from '@zro/common';
import { Logger } from 'winston';

export interface PaymentCronConfig {
  APP_ENV: string;
  APP_SYNC_CIELO_PAYMENT_CRON: string;

  APP_SYNC_CIELO_PAYMENT_REDIS_KEY: string;
  APP_SYNC_CIELO_PAYMENT_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_CIELO_PAYMENT_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class PaymentCronService implements OnModuleInit {
  private syncCieloPaymentRedisKey: string;
  private syncCieloPaymentRedisLockTimeout: number;
  private syncCieloPaymentRedisRefreshInterval: number;

  private checkoutRepository: CheckoutRepository;
  private checkoutHistoryRepository: CheckoutHistoricRepository;

  constructor(
    @InjectLogger()
    private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<PaymentCronConfig>,
    private readonly redisService: RedisService,
    private readonly service: CieloClientHttpService,
  ) {
    this.checkoutRepository = new CheckoutDatabaseRepository();
    this.checkoutHistoryRepository = new CheckoutHistoricDatabaseRepository();
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const cieloPaymentSync = new CronJob(
      this.configService.get<string>('APP_SYNC_CIELO_PAYMENT_CRON'),
      () => this.syncCieloPayments(),
    );

    //Cron redis settings
    this.syncCieloPaymentRedisKey = this.configService.get<string>(
      'APP_SYNC_CIELO_PAYMENT_REDIS_KEY',
    );
    this.syncCieloPaymentRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_CIELO_PAYMENT_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncCieloPaymentRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_CIELO_PAYMENT_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !cieloPaymentSync ||
      !this.syncCieloPaymentRedisKey ||
      !this.syncCieloPaymentRedisLockTimeout ||
      !this.syncCieloPaymentRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!cieloPaymentSync ? ['APP_SYNC_CIELO_PAYMENT_CRON'] : []),
        ...(!this.syncCieloPaymentRedisKey
          ? ['APP_SYNC_CIELO_PAYMENT_REDIS_KEY']
          : []),
        ...(!this.syncCieloPaymentRedisLockTimeout
          ? ['APP_SYNC_CIELO_PAYMENT_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncCieloPaymentRedisRefreshInterval
          ? ['APP_SYNC_CIELO_PAYMENT_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.PAYMENT.SYNC_CIELO,
      cieloPaymentSync,
    );

    cieloPaymentSync.start();
  }

  async syncCieloPayments() {
    await this.redisService.semaphoreRefresh(
      this.syncCieloPaymentRedisKey,
      this.syncCieloPaymentRedisLockTimeout,
      this.syncCieloPaymentRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });
        try {
          await this.processPendingPayments();
        } catch (error) {
          logger.error('Error with sync cielo payments.', { error });
        }
      },
    );
  }

  async processPendingPayments() {
    const items = await this.checkoutRepository.findCheckoutPending();

    if (!items)
      throw {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Nenhum registro encontrado.',
      };
    await this.updateCheckouts(items);
  }

  getEnumKey<T>(enumObj: T, enumValue: number): keyof T | undefined {
    return (Object.keys(enumObj) as Array<keyof T>).find(
      (key) => enumObj[key] === enumValue,
    );
  }

  getCurrentStatus(checkout) {
    if (checkout && checkout.historic && checkout.historic.length > 0) {
      const latest = checkout.historic[checkout.historic.length - 1];
      return latest.currentStatus;
    }
    return null;
  }

  updateCheckouts = async (items) => {
    for (const item of items) {
      this.logger.debug('Cron Cielo started.', { item });
      const referenceId = item.referenceId;
      try {
        if (referenceId) {
          const cieloResponse = await this.service.getTransaction(referenceId);

          item.status = this.getEnumKey(
            CieloTransactionStatusEnum,
            cieloResponse.Payment.Status,
          );
          item.referenceId = cieloResponse.Payment.PaymentId;

          if (cieloResponse.Payment.AuthorizationCode)
            item.authorizationId = cieloResponse.Payment.AuthorizationCode;

          const historics =
            await this.checkoutHistoryRepository.findByCheckoutId(item.id);

          if (historics && historics.length > 0) item.historic = historics;

          const historic = this.createCheckoutHistoricModel(
            item,
            cieloResponse,
          );

          await this.checkoutRepository.update(item);
          await this.checkoutRepository.create(historic);
        }
      } catch (error) {
        this.logger.debug(
          `Error processing referenceId ${referenceId}: ${error}`,
        );
      }
    }
  };

  createCheckoutHistoricModel(model: any, response: any) {
    if (response.Payment.DebitCard) delete response.Payment.DebitCard;

    if (response.Payment.CreditCard) delete response.Payment.CreditCard;

    const historicModel: CheckoutHistoric = {
      id: uuidV4(),
      checkoutId: model.id,
      previousStatus: this.getCurrentStatus(model),
      currentStatus: this.getEnumKey(
        CieloTransactionStatusEnum,
        response.Payment.Status,
      ),
      action: 'cron',
      response: response,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return historicModel;
  }
}
