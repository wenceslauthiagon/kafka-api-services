import { Span } from 'nestjs-otel';
import { CronJob } from 'cron';
import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  InjectLogger,
  KafkaService,
  MissingEnvVarException,
} from '@zro/common';
import {
  WithdrawFilter,
  WithdrawSettingType,
  WithdrawSettingWeekDays,
} from '@zro/utils/domain';
import {
  CRON_TASKS,
  OperationServiceKafka,
  PixKeyServiceKafka,
  PixPaymentServiceKafka,
  UserWithdrawSettingDatabaseRepository,
} from '@zro/utils/infrastructure';
import { SyncUserWithdrawSettingController } from '@zro/utils/interface';

interface UserWithdrawSettingCronConfig {
  APP_ENV: string;
  APP_SYNC_USER_WITHDRAW_SETTING_DAILY_CRON: string;
  APP_SYNC_USER_WITHDRAW_SETTING_BALANCE_CRON: string;
  APP_SYNC_USER_WITHDRAW_SETTING_DAY_5_CRON: string;
  APP_SYNC_USER_WITHDRAW_SETTING_DAY_15_CRON: string;
  APP_SYNC_USER_WITHDRAW_SETTING_DAY_25_CRON: string;
  APP_SYNC_USER_WITHDRAW_SETTING_MONDAY_CRON: string;
  APP_SYNC_USER_WITHDRAW_SETTING_TUESDAY_CRON: string;
  APP_SYNC_USER_WITHDRAW_SETTING_WEDNESDAY_CRON: string;
  APP_SYNC_USER_WITHDRAW_SETTING_THURSDAY_CRON: string;
  APP_SYNC_USER_WITHDRAW_SETTING_FRIDAY_CRON: string;
  APP_SYNC_USER_WITHDRAW_SETTING_SATURDAY_CRON: string;
  APP_SYNC_USER_WITHDRAW_SETTING_SUNDAY_CRON: string;
  APP_PIX_PAYMENT_OPERATION_CURRENCY_TAG: string;
}

@Injectable()
export class UserWithdrawSettingCronServiceInit implements OnModuleInit {
  /**
   * Check if this cron is already running
   */
  private syncUserWithdrawSettingIsRunning = false;
  private pixPaymentOperationCurrencyTag: string;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<UserWithdrawSettingCronConfig>,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: UserWithdrawSettingCronServiceInit.name,
    });
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    this.pixPaymentOperationCurrencyTag = this.configService.get<string>(
      'APP_PIX_PAYMENT_OPERATION_CURRENCY_TAG',
    );

    if (!this.pixPaymentOperationCurrencyTag) {
      throw new MissingEnvVarException(
        'APP_PIX_PAYMENT_OPERATION_CURRENCY_TAG',
      );
    }

    this.configDaily();
    this.configBalance();
    this.configMonthly();
    this.configWeekly();
  }

  private configCron(
    env: keyof UserWithdrawSettingCronConfig,
    cronTask: string,
    withdrawFilter: WithdrawFilter,
  ) {
    const cronTime = this.configService.get<string>(env);

    if (!cronTime) {
      throw new MissingEnvVarException(env);
    }

    const cronJob = new CronJob(cronTime, () =>
      this.syncUserWithdrawSetting(withdrawFilter),
    );

    this.schedulerRegistry.addCronJob(cronTask, cronJob);

    cronJob.start();
  }

  private configDaily() {
    this.configCron(
      'APP_SYNC_USER_WITHDRAW_SETTING_DAILY_CRON',
      CRON_TASKS.USER_WITHDRAW_SETTING.DAILY_SYNC,
      { type: WithdrawSettingType.DAILY },
    );
  }

  private configBalance() {
    this.configCron(
      'APP_SYNC_USER_WITHDRAW_SETTING_BALANCE_CRON',
      CRON_TASKS.USER_WITHDRAW_SETTING.BALANCE_SYNC,
      { type: WithdrawSettingType.BALANCE },
    );
  }

  private configMonthly() {
    this.configCron(
      'APP_SYNC_USER_WITHDRAW_SETTING_DAY_5_CRON',
      CRON_TASKS.USER_WITHDRAW_SETTING.DAY_5_SYNC,
      { type: WithdrawSettingType.MONTHLY, day: 5 },
    );

    this.configCron(
      'APP_SYNC_USER_WITHDRAW_SETTING_DAY_15_CRON',
      CRON_TASKS.USER_WITHDRAW_SETTING.DAY_15_SYNC,
      { type: WithdrawSettingType.MONTHLY, day: 15 },
    );

    this.configCron(
      'APP_SYNC_USER_WITHDRAW_SETTING_DAY_25_CRON',
      CRON_TASKS.USER_WITHDRAW_SETTING.DAY_25_SYNC,
      { type: WithdrawSettingType.MONTHLY, day: 25 },
    );
  }

  private configWeekly() {
    this.configCron(
      'APP_SYNC_USER_WITHDRAW_SETTING_MONDAY_CRON',
      CRON_TASKS.USER_WITHDRAW_SETTING.MONDAY_SYNC,
      {
        type: WithdrawSettingType.WEEKLY,
        weekDay: WithdrawSettingWeekDays.MONDAY,
      },
    );

    this.configCron(
      'APP_SYNC_USER_WITHDRAW_SETTING_TUESDAY_CRON',
      CRON_TASKS.USER_WITHDRAW_SETTING.TUESDAY_SYNC,
      {
        type: WithdrawSettingType.WEEKLY,
        weekDay: WithdrawSettingWeekDays.TUESDAY,
      },
    );

    this.configCron(
      'APP_SYNC_USER_WITHDRAW_SETTING_WEDNESDAY_CRON',
      CRON_TASKS.USER_WITHDRAW_SETTING.WEDNESDAY_SYNC,
      {
        type: WithdrawSettingType.WEEKLY,
        weekDay: WithdrawSettingWeekDays.WEDNESDAY,
      },
    );

    this.configCron(
      'APP_SYNC_USER_WITHDRAW_SETTING_THURSDAY_CRON',
      CRON_TASKS.USER_WITHDRAW_SETTING.THURSDAY_SYNC,
      {
        type: WithdrawSettingType.WEEKLY,
        weekDay: WithdrawSettingWeekDays.THURSDAY,
      },
    );

    this.configCron(
      'APP_SYNC_USER_WITHDRAW_SETTING_FRIDAY_CRON',
      CRON_TASKS.USER_WITHDRAW_SETTING.FRIDAY_SYNC,
      {
        type: WithdrawSettingType.WEEKLY,
        weekDay: WithdrawSettingWeekDays.FRIDAY,
      },
    );

    this.configCron(
      'APP_SYNC_USER_WITHDRAW_SETTING_SATURDAY_CRON',
      CRON_TASKS.USER_WITHDRAW_SETTING.SATURDAY_SYNC,
      {
        type: WithdrawSettingType.WEEKLY,
        weekDay: WithdrawSettingWeekDays.SATURDAY,
      },
    );

    this.configCron(
      'APP_SYNC_USER_WITHDRAW_SETTING_SUNDAY_CRON',
      CRON_TASKS.USER_WITHDRAW_SETTING.SUNDAY_SYNC,
      {
        type: WithdrawSettingType.WEEKLY,
        weekDay: WithdrawSettingWeekDays.SUNDAY,
      },
    );
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncUserWithdrawSetting(withdrawFilter: WithdrawFilter) {
    if (this.syncUserWithdrawSettingIsRunning) {
      return;
    }

    this.syncUserWithdrawSettingIsRunning = true;

    const requestId = uuidV4();
    const logger = this.logger.child({ loggerId: requestId });

    try {
      const userWithdrawSettingRepository =
        new UserWithdrawSettingDatabaseRepository();

      const operationService = new OperationServiceKafka(
        requestId,
        logger,
        this.kafkaService,
      );
      const pixKeyService = new PixKeyServiceKafka(
        requestId,
        logger,
        this.kafkaService,
      );
      const pixPaymentService = new PixPaymentServiceKafka(
        requestId,
        logger,
        this.kafkaService,
      );

      logger.debug('Sync user withdraw setting started.');

      const syncUserWithdrawSettingController =
        new SyncUserWithdrawSettingController(
          logger,
          userWithdrawSettingRepository,
          operationService,
          pixKeyService,
          pixPaymentService,
          this.pixPaymentOperationCurrencyTag,
        );

      await syncUserWithdrawSettingController.execute(withdrawFilter);

      logger.debug('Sync user withdraw setting finished.');
    } catch (error) {
      logger.error('Error with sync user withdraw setting.', error);
    }

    this.syncUserWithdrawSettingIsRunning = false;
  }
}
