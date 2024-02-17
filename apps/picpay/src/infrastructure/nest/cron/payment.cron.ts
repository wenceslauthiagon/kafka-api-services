import { CronJob } from 'cron';
import { v4 as uuidV4 } from 'uuid';
import {
  CRON_TASKS,
  CheckoutDatabaseRepository,
  CheckoutHistoricDatabaseRepository,
  PicpayClientService,
} from '@zro/picpay/infrastructure';
import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CheckoutHistoric, PaymentStatusEnum } from '@zro/picpay/domain';
import { CheckoutRepository } from '@zro/picpay/domain/repositories/checkout.repository';
import { CheckoutHistoricRepository } from '@zro/picpay/domain/repositories/checkout_historic.repository';
import {
  InjectLogger,
  MissingEnvVarException,
  RedisService,
} from '@zro/common';
import { Logger } from 'winston';

export interface PaymentCronConfig {
  APP_ENV: string;
  APP_SYNC_PICPAY_PAYMENT_CRON: string;

  APP_SYNC_PICPAY_PAYMENT_REDIS_KEY: string;
  APP_SYNC_PICPAY_PAYMENT_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_PICPAY_PAYMENT_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class PaymentCronService implements OnModuleInit {
  private syncPicPayPaymentRedisKey: string;
  private syncPicPayPaymentRedisLockTimeout: number;
  private syncPicPayPaymentRedisRefreshInterval: number;

  private checkoutRepository: CheckoutRepository;
  private checkoutHistoricRepository: CheckoutHistoricRepository;

  constructor(
    @InjectLogger()
    private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<PaymentCronConfig>,
    private readonly redisService: RedisService,
    private readonly service: PicpayClientService,
  ) {
    this.checkoutRepository = new CheckoutDatabaseRepository();
    this.checkoutHistoricRepository = new CheckoutHistoricDatabaseRepository();
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const pixPaymentSyncPicPay = new CronJob(
      this.configService.get<string>('APP_SYNC_PICPAY_PAYMENT_CRON'),
      () => this.syncPicPayPixPayments(),
    );

    //Cron redis settings
    this.syncPicPayPaymentRedisKey = this.configService.get<string>(
      'APP_SYNC_PICPAY_PAYMENT_REDIS_KEY',
    );
    this.syncPicPayPaymentRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_PICPAY_PAYMENT_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncPicPayPaymentRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_PICPAY_PAYMENT_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !pixPaymentSyncPicPay ||
      !this.syncPicPayPaymentRedisKey ||
      !this.syncPicPayPaymentRedisLockTimeout ||
      !this.syncPicPayPaymentRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!pixPaymentSyncPicPay ? ['APP_SYNC_PICPAY_PAYMENT_CRON'] : []),
        ...(!this.syncPicPayPaymentRedisKey
          ? ['APP_SYNC_PICPAY_PAYMENT_REDIS_KEY']
          : []),
        ...(!this.syncPicPayPaymentRedisLockTimeout
          ? ['APP_SYNC_PICPAY_PAYMENT_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncPicPayPaymentRedisRefreshInterval
          ? ['APP_SYNC_PICPAY_PAYMENT_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.PAYMENT.SYNC_PICPAY,
      pixPaymentSyncPicPay,
    );

    pixPaymentSyncPicPay.start();
  }

  async syncPicPayPixPayments() {
    await this.redisService.semaphoreRefresh(
      this.syncPicPayPaymentRedisKey,
      this.syncPicPayPaymentRedisLockTimeout,
      this.syncPicPayPaymentRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          await this.processPendingPayments();
        } catch (error) {
          logger.error('Error with sync picpay payments.', { error });
        }
      },
    );
  }

  async processPendingPayments() {
    const items = await this.checkoutRepository.findCheckoutPending();

    if (!items)
      throw {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Nenhum registro encontrado.', //todo - colocar o arquivo de exceção e chamar o mesmo
      };
    await this.updateCheckouts(items);
  }

  updateCheckouts = async (items) => {
    for (const item of items) {
      this.logger.debug('Cron PicPay started.', { item });
      const referenceId = item.referenceId;

      const model = await this.checkoutRepository.getByReferenceId(referenceId);
      this.logger.debug('Get Checkout successful.', { model });

      try {
        const payment = await this.service.getPaymentStatus(referenceId);
        this.logger.debug('Get payment in picpay successful.', { payment });

        if (model.status !== payment.status) {
          const historicModel: CheckoutHistoric = {
            id: uuidV4(),
            checkoutId: item.id,
            previousStatus: model.status,
            currentStatus: payment.status,
            action: PaymentStatusEnum.CRONJOBUPDATED,
            response: JSON.stringify(payment),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          model.status = payment.status;
          model.authorizationId = payment.authorizationId;

          this.logger.debug('Create CheckoutHistoric.', { historicModel });
          await this.checkoutHistoricRepository.create(historicModel);

          await this.checkoutRepository.update(model);
          this.logger.debug('Cron PicPay finished.', { model });
        }
      } catch (error) {
        this.logger.debug(
          `Error processing referenceId ${referenceId}: ${error}`,
        );
      }
    }
  };
}
