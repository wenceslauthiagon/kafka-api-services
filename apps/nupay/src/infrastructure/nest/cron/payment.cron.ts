import { CronJob } from 'cron';
import { v4 as uuidV4 } from 'uuid';
import {
  CRON_TASKS,
  CheckoutDatabaseRepository,
  CheckoutHistoricDatabaseRepository,
  NuPayClientService,
} from '@zro/nupay/infrastructure';
import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Checkout, CheckoutHistoric } from '@zro/nupay/domain';
import { CheckoutRepository } from '@zro/nupay/domain/repositories/checkout.repository';
import { CheckoutHistoricRepository } from '@zro/nupay/domain/repositories/checkout_historic.repository';
import {
  InjectLogger,
  MissingEnvVarException,
  RedisService,
} from '@zro/common';
import { Logger } from 'winston';

export interface PaymentCronConfig {
  APP_ENV: string;
  APP_SYNC_NUPAY_PAYMENT_CRON: string;

  APP_SYNC_NUPAY_PAYMENT_REDIS_KEY: string;
  APP_SYNC_NUPAY_PAYMENT_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_NUPAY_PAYMENT_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class PaymentCronService implements OnModuleInit {
  private syncNuPayPaymentRedisKey: string;
  private syncNuPayPaymentRedisLockTimeout: number;
  private syncNuPayPaymentRedisRefreshInterval: number;

  private checkoutRepository: CheckoutRepository;
  private checkoutHistoricRepository: CheckoutHistoricRepository;

  constructor(
    @InjectLogger()
    private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<PaymentCronConfig>,
    private readonly redisService: RedisService,
    private readonly service: NuPayClientService,
  ) {
    this.checkoutRepository = new CheckoutDatabaseRepository();
    this.checkoutHistoricRepository = new CheckoutHistoricDatabaseRepository();
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const pixPaymentSyncNuPay = new CronJob(
      this.configService.get<string>('APP_SYNC_NUPAY_PAYMENT_CRON'),
      () => this.syncNuPayPixPayments(),
    );

    //Cron redis settings
    this.syncNuPayPaymentRedisKey = this.configService.get<string>(
      'APP_SYNC_NUPAY_PAYMENT_REDIS_KEY',
    );
    this.syncNuPayPaymentRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_NUPAY_PAYMENT_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncNuPayPaymentRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_NUPAY_PAYMENT_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !pixPaymentSyncNuPay ||
      !this.syncNuPayPaymentRedisKey ||
      !this.syncNuPayPaymentRedisLockTimeout ||
      !this.syncNuPayPaymentRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!pixPaymentSyncNuPay ? ['APP_SYNC_NUPAY_PAYMENT_CRON'] : []),
        ...(!this.syncNuPayPaymentRedisKey
          ? ['APP_SYNC_NUPAY_PAYMENT_REDIS_KEY']
          : []),
        ...(!this.syncNuPayPaymentRedisLockTimeout
          ? ['APP_SYNC_NUPAY_PAYMENT_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncNuPayPaymentRedisRefreshInterval
          ? ['APP_SYNC_NUPAY_PAYMENT_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.PAYMENT.SYNC_NUPAY,
      pixPaymentSyncNuPay,
    );

    pixPaymentSyncNuPay.start();
  }

  async syncNuPayPixPayments() {
    await this.redisService.semaphoreRefresh(
      this.syncNuPayPaymentRedisKey,
      this.syncNuPayPaymentRedisLockTimeout,
      this.syncNuPayPaymentRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          await this.processPendingPayments();
        } catch (error) {
          logger.error('Error with sync nupay payments.', { error });
        }
      },
    );
  }

  async processPendingPayments() {
    const items = await this.checkoutRepository.findPending();

    if (!items)
      throw {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'Nenhum registro encontrado.', //todo - colocar o arquivo de exceção e chamar o mesmo
      };
    await this.updateCheckouts(items);
  }

  updateCheckouts = async (items) => {
    for (const item of items) {
      this.logger.debug('Cron NuPay started.', { item });
      const referenceId = item.referenceId;
      const checkout =
        await this.checkoutRepository.getByReferenceId(referenceId);

      this.logger.debug('Get Checkout successful.', { checkout });

      try {
        const isRefund = checkout.status.startsWith('REFUND_');
        if (isRefund) {
          this.updateRefund(checkout);
        } else {
          this.updatePayment(checkout);
        }

        this.logger.debug('Cron NuPay finished.', { checkout });
      } catch (error) {
        this.logger.debug(
          `Error processing referenceId ${referenceId}: ${error}`,
        );
      }
    }
  };

  updatePayment = async (checkout: Checkout) => {
    const paymentStatus = await this.service.getPaymentStatus(
      checkout.referenceId,
    );
    this.logger.debug('Get payment status in nupay successful.', {
      paymentStatus,
    });
    this.createCheckoutHistoric(checkout, paymentStatus.status, paymentStatus);
  };

  updateRefund = async (checkout: Checkout) => {
    const refundStatus = await this.service.getRefundStatus(
      checkout.referenceId,
      checkout.authorizationId,
    );
    this.logger.debug('Get refund status in nupay successful.', {
      refundStatus,
    });
    this.createCheckoutHistoric(
      checkout,
      `REFUND_${refundStatus.status}`,
      refundStatus,
    );
  };

  createCheckoutHistoric = async (
    checkout: Checkout,
    status: string,
    response: any,
  ) => {
    const historicModel: CheckoutHistoric = {
      id: uuidV4(),
      checkoutId: checkout.id,
      previousStatus: checkout.status,
      currentStatus: status,
      action: 'PaymentCronService',
      response,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    checkout.status = status;

    await this.checkoutHistoricRepository.create(historicModel);

    await this.checkoutRepository.update(checkout);

    this.logger.debug('Create CheckoutHistoric.', { historicModel });
  };
}
