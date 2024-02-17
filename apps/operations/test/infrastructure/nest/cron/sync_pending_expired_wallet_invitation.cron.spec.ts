import { createMock } from 'ts-auto-mock';
import { Mutex } from 'redis-semaphore';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaService, getMoment } from '@zro/common';
import { WalletInvitationState } from '@zro/operations/domain';
import {
  WalletInvitationModel,
  SyncPendingExpiredWalletInvitationCronService as Cron,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { WalletInvitationFactory } from '@zro/test/operations/config';

jest.mock('redis-semaphore');
jest.mock('ioredis');

describe('SyncPendingExpiredWalletInvitationCronService', () => {
  let module: TestingModule;
  let controller: Cron;

  const kafkaService: KafkaService = createMock<KafkaService>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();
    controller = module.get<Cron>(Cron);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('SyncPendingExpiredWalletInvitationCronService', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not sync pending if is not expired', async () => {
        const oneDayAfterToday = getMoment().add(1, 'days').toDate();

        const walletInvitation =
          await WalletInvitationFactory.create<WalletInvitationModel>(
            WalletInvitationModel.name,
            {
              state: WalletInvitationState.PENDING,
              expiredAt: oneDayAfterToday,
            },
          );

        jest.spyOn(Mutex.prototype, 'tryAcquire').mockResolvedValue(true);

        await controller.execute();

        const result = await WalletInvitationModel.findOne({
          where: { id: walletInvitation.id },
        });

        expect(result).toBeDefined();
        expect(result.id).toBe(walletInvitation.id);
        expect(result.state).toBe(WalletInvitationState.PENDING);
      });

      it('TC0002 - Should not sync pending if has invalid state', async () => {
        const oneDayBeforeToday = getMoment().subtract(1, 'days').toDate();

        const walletInvitation =
          await WalletInvitationFactory.create<WalletInvitationModel>(
            WalletInvitationModel.name,
            {
              state: WalletInvitationState.CANCELED,
              expiredAt: oneDayBeforeToday,
            },
          );
        jest.spyOn(Mutex.prototype, 'tryAcquire').mockResolvedValue(true);

        await controller.execute();

        const result = await WalletInvitationModel.findOne({
          where: { id: walletInvitation.id },
        });

        expect(result).toBeDefined();
        expect(result.id).toBe(walletInvitation.id);
        expect(result.state).toBe(WalletInvitationState.CANCELED);
      });
    });

    describe('With valid parameters', () => {
      it('TC0003 - Should execute successfully', async () => {
        const oneDayBeforeToday = getMoment().subtract(1, 'days').toDate();

        const walletInvitation =
          await WalletInvitationFactory.create<WalletInvitationModel>(
            WalletInvitationModel.name,
            {
              state: WalletInvitationState.PENDING,
              expiredAt: oneDayBeforeToday,
            },
          );
        jest.spyOn(Mutex.prototype, 'tryAcquire').mockResolvedValue(true);

        await controller.execute();

        const result = await WalletInvitationModel.findOne({
          where: { id: walletInvitation.id },
        });

        expect(result).toBeDefined();
        expect(result.id).toBe(walletInvitation.id);
        expect(result.state).toBe(WalletInvitationState.EXPIRED);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
