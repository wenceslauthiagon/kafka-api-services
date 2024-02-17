import { Span } from 'nestjs-otel';
import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  InjectLogger,
  InjectSequelize,
  KafkaService,
  MissingEnvVarException,
  RedisService,
} from '@zro/common';
import {
  CRON_TASKS,
  BotOtcDatabaseRepository,
  QuotationServiceKafka,
  OtcServiceKafka,
  OperationServiceKafka,
  BotOtcOrderDatabaseRepository,
} from '@zro/otc-bot/infrastructure';
import { BotOtc, BotOtcControl, BotOtcStatus } from '@zro/otc-bot/domain';
import { Sequelize } from 'sequelize';
import { RunBotOtcController } from '@zro/otc-bot/interface';
import { CryptoRemittanceGateway } from '@zro/otc/application';
import { B2C2CryptoRemittanceService } from '@zro/b2c2';
import { BinanceCryptoRemittanceService } from '@zro/binance';

export interface BotOtcCronConfig {
  APP_ENV: string;
  APP_BOT_OTC_CONTROL_INTERVAL_MS: number;

  APP_SYNC_BOT_OTC_REDIS_KEY: string;
  APP_SYNC_BOT_OTC_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_BOT_OTC_REDIS_REFRESH_INTERVAL: number;
}

type BotOtcController = {
  bot: BotOtc;
  isRunning: Promise<void>;
};

@Injectable()
export class BotOtcCronService implements OnModuleInit, OnModuleDestroy {
  private botControls: Record<string, BotOtcController> = {};
  private cryptoRemittanceGateways: CryptoRemittanceGateway[] = [];

  /**
   * Envs for cron settings
   */
  private syncBotOtcRedisKey: string;
  private syncBotOtcRedisLockTimeout: number;
  private syncBotOtcRedisRefreshInterval: number;

  /**
   *
   * @param logger
   * @param schedulerRegistry
   * @param configService
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<BotOtcCronConfig>,
    @InjectSequelize() private readonly sequelize: Sequelize,
    private readonly kafkaService: KafkaService,
    private readonly b2C2CryptoRemittanceService: B2C2CryptoRemittanceService,
    private readonly binanceCryptoRemittanceService: BinanceCryptoRemittanceService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({ context: BotOtcCronService.name });
  }

  /**
   * Initialize bot control.
   */
  async onModuleInit(): Promise<void> {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    this.cryptoRemittanceGateways = [
      this.b2C2CryptoRemittanceService.getB2C2CryptoRemittanceGateway(
        this.logger,
      ),
      this.binanceCryptoRemittanceService.getBinanceCryptoRemittanceGateway(
        this.logger,
      ),
    ];

    // Time to update running bot status.
    const appBotOtcControlInterval = this.configService.get<number>(
      'APP_BOT_OTC_CONTROL_INTERVAL_MS',
      10000,
    );

    //Cron redis settings
    this.syncBotOtcRedisKey = this.configService.get<string>(
      'APP_SYNC_BOT_OTC_REDIS_KEY',
    );
    this.syncBotOtcRedisLockTimeout = Number(
      this.configService.get<number>('APP_SYNC_BOT_OTC_REDIS_LOCK_TIMEOUT'),
    );
    this.syncBotOtcRedisRefreshInterval = Number(
      this.configService.get<number>('APP_SYNC_BOT_OTC_REDIS_REFRESH_INTERVAL'),
    );

    if (
      !this.syncBotOtcRedisKey ||
      !this.syncBotOtcRedisLockTimeout ||
      !this.syncBotOtcRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncBotOtcRedisKey ? ['APP_SYNC_BOT_OTC_REDIS_KEY'] : []),
        ...(!this.syncBotOtcRedisLockTimeout
          ? ['APP_SYNC_BOT_OTC_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncBotOtcRedisRefreshInterval
          ? ['APP_SYNC_BOT_OTC_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    const interval = setInterval(async () => {
      await this.execute();
    }, appBotOtcControlInterval);

    this.schedulerRegistry.addInterval(CRON_TASKS.BOT_OTC_CONTROL, interval);

    // Stop all before start
    const transaction = await this.sequelize.transaction();
    const botOtcRepository = new BotOtcDatabaseRepository(transaction);

    const bots = await botOtcRepository.getAll();

    // Kill all bots
    await Promise.all(bots.map((bot) => this.killBot(bot)));

    await transaction.commit();
  }

  /**
   * Shutdown quotation service.
   */
  async onModuleDestroy() {
    if (this.configService.get<string>('APP_ENV') === 'test') return;

    // Ask bots to die
    await Promise.all(
      Object.values(this.botControls).map((botControl) =>
        this.killBot(botControl.bot),
      ),
    );

    // Delete interval
    this.schedulerRegistry
      .getIntervals()
      .filter((interval) => interval.startsWith(CRON_TASKS.BOT_OTC_CONTROL))
      .forEach((interval) => this.schedulerRegistry.deleteInterval(interval));
  }

  private getIntervalKey(bot: BotOtc) {
    return `${CRON_TASKS.BOT_OTC_CONTROL}_${bot.name}`;
  }

  private async startBot(bot: BotOtc): Promise<void> {
    // Ask bot to start.
    const transaction = await this.sequelize.transaction();
    const botOtcRepository = new BotOtcDatabaseRepository(transaction);

    bot.status = BotOtcStatus.RUNNING;
    await botOtcRepository.update(bot);

    // Schedule bot execution.
    const interval = setInterval((bot) => this.executeBot(bot.name), 1000, bot);
    this.schedulerRegistry.addInterval(this.getIntervalKey(bot), interval);

    await transaction.commit();
  }

  private async stopBot(bot: BotOtc): Promise<void> {
    const intervalId = this.getIntervalKey(bot);

    if (bot.isRunning()) {
      const transaction = await this.sequelize.transaction();
      const botOtcRepository = new BotOtcDatabaseRepository(transaction);

      // Ask bot to stop
      bot.status = BotOtcStatus.STOPPING;
      await botOtcRepository.update(bot);

      await transaction.commit();
    }

    // Cancel current schedule
    if (this.schedulerRegistry.doesExist('interval', intervalId)) {
      const interval = this.schedulerRegistry.getInterval(intervalId);
      interval && clearInterval(interval);
      interval && this.schedulerRegistry.deleteInterval(intervalId);
    }

    // Wait bot to stop.
    const botControl = this.botControls[bot.name];
    botControl.isRunning && (await botControl.isRunning);

    const transaction = await this.sequelize.transaction();
    const botOtcRepository = new BotOtcDatabaseRepository(transaction);

    if (bot.isStoping()) {
      // Stop bot
      bot.status = BotOtcStatus.STOPPED;
    }

    bot.control = BotOtcControl.STAND_BY;
    await botOtcRepository.update(bot);

    await transaction.commit();

    delete this.botControls[bot.name];
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  private async killBot(bot: BotOtc) {
    if (bot.shouldKill()) {
      const transaction = await this.sequelize.transaction();
      const botOtcRepository = new BotOtcDatabaseRepository(transaction);

      // Kill bot.
      bot.status = BotOtcStatus.STOPPED;
      await botOtcRepository.update(bot);

      await transaction.commit();
    }

    const intervalId = this.getIntervalKey(bot);

    // Cancel current scheduler
    if (this.schedulerRegistry.doesExist('interval', intervalId)) {
      const interval = this.schedulerRegistry.getInterval(intervalId);
      interval && clearInterval(interval);
      interval && this.schedulerRegistry.deleteInterval(intervalId);
    }
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  private async execute(): Promise<void> {
    await this.redisService.semaphoreRefresh(
      this.syncBotOtcRedisKey,
      this.syncBotOtcRedisLockTimeout,
      this.syncBotOtcRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        const transaction = await this.sequelize.transaction();

        try {
          const botOtcRepository = new BotOtcDatabaseRepository(transaction);

          const foundBots = await botOtcRepository.getAll();

          // Update bot control
          foundBots.forEach((bot) => {
            if (!!this.botControls[bot.name]) {
              const status = this.botControls[bot.name].bot.status;
              Object.assign(this.botControls[bot.name].bot, bot, { status });
            } else {
              // Add bot to control.
              this.botControls[bot.name] = {
                bot,
                isRunning: null,
              };
            }
          });

          const bots = Object.values(this.botControls).map((bc) => bc.bot);

          // Stop running bots
          await Promise.all(
            bots
              .filter((bot) => bot.shouldStop())
              .map((bot) => this.stopBot(bot)),
          );

          // Start stoped bots
          await Promise.all(
            bots
              .filter((bot) => bot.shouldStart())
              .map(async (bot) => this.startBot(bot)),
          );

          await transaction.commit();
        } catch (error) {
          await transaction.rollback();
          logger.error('Response error.', {
            errorMessage: error.message,
            stack: error.stack,
          });
        }
      },
    );
  }

  private async executeBot(botName: string): Promise<void> {
    // Get bot control.
    const botControl = this.botControls[botName];
    const bot = botControl.bot;

    // Safe check.
    if (botControl.isRunning) return;

    botControl.isRunning = new Promise(async (resolve) => {
      // Execute bot.
      const requestId = uuidV4();
      const logger = this.logger.child({ loggerId: requestId });

      const transaction = await this.sequelize.transaction();
      const botOtcRepository = new BotOtcDatabaseRepository(transaction);
      const botOtcOrderRepository = new BotOtcOrderDatabaseRepository(
        transaction,
      );

      const quotationService = new QuotationServiceKafka(
        requestId,
        logger,
        this.kafkaService,
      );

      const otcService = new OtcServiceKafka(
        requestId,
        logger,
        this.kafkaService,
      );

      const operationService = new OperationServiceKafka(
        requestId,
        logger,
        this.kafkaService,
      );

      const botController = new RunBotOtcController(
        logger,
        botOtcRepository,
        botOtcOrderRepository,
        quotationService,
        otcService,
        operationService,
        this.cryptoRemittanceGateways,
      );

      // Execute bot algorithm.
      try {
        logger.debug('Execute bot');
        await botController.execute({
          id: bot.id,
          type: bot.type,
        });
        logger.debug('Execute done');
      } catch (error) {
        bot.status = BotOtcStatus.ERROR;
        bot.control = BotOtcControl.STOP;
        bot.failedCode = error.code ?? 'UNEXPECTED_BOT_ERROR';
        // FIXME: Colocar a tradução utilizando o código do error.
        bot.failedMessage = error.message;
        logger.error('Bot failed', { error });

        await botOtcRepository.update(bot);
      }

      await transaction.commit();

      resolve();
    });

    await botControl.isRunning;

    // Clear running control.
    botControl.isRunning = null;
  }
}
