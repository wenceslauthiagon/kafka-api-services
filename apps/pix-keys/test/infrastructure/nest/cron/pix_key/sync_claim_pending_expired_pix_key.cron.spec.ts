import { Mutex } from 'redis-semaphore';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { getMoment, KafkaService } from '@zro/common';
import { KeyState } from '@zro/pix-keys/domain';
import {
  PixKeyModel,
  SyncClaimPendingExpiredPixKeyCronService as Cron,
  KAFKA_EVENTS,
  PixKeyClaimModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { PixKeyClaimFactory, PixKeyFactory } from '@zro/test/pix-keys/config';

jest.mock('redis-semaphore');
jest.mock('ioredis');

const DAY_IN_SECONDS = 24 * 60 * 60;
const TIMESTAMP = 7 * DAY_IN_SECONDS; // 7 days in seconds.

describe('SyncClaimPendingExpiredPixKeyCronService', () => {
  let module: TestingModule;
  let controller: Cron;

  const kafkaService: KafkaService = createMock<KafkaService>();
  const mockEmitKafkaService: jest.Mock = On(kafkaService).get(
    method((mock) => mock.emit),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();
    controller = module.get<Cron>(Cron);
  });

  beforeEach(async () => {
    await PixKeyModel.truncate({ cascade: true });
    jest.resetAllMocks();
  });

  describe('With invalid parameters', () => {
    it('TC0001 - Should not sync claim pending if is not expired', async () => {
      const claim = await PixKeyFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        { claimOpeningDate: new Date() },
      );

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CLAIM_PENDING,
        canceledAt: null,
        claim,
      });

      jest.spyOn(Mutex.prototype, 'tryAcquire').mockResolvedValue(true);

      await controller.execute();

      const result = await PixKeyModel.findOne({
        where: { id: pixKey.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.canceledAt).toBeNull();
      expect(result.state).toBe(KeyState.CLAIM_PENDING);
    });

    it('TC0002 - Should not sync claim pending if has invalid state', async () => {
      const claim = await PixKeyFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        { claimOpeningDate: new Date() },
      );

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CLAIM_DENIED,
        updatedAt: new Date(),
        canceledAt: null,
        claim,
      });

      jest.spyOn(Mutex.prototype, 'tryAcquire').mockResolvedValue(true);

      await controller.execute();

      const result = await PixKeyModel.findOne({
        where: { id: pixKey.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.canceledAt).toBeNull();
      expect(result.state).not.toBe(KeyState.CLAIM_PENDING);
      expect(result.state).not.toBe(KeyState.CANCELED);
    });

    it('TC0003 - Should not sync claim pending if is not expired', async () => {
      // one day before limit
      const notExpiredDate = getMoment()
        .subtract(TIMESTAMP, 'seconds')
        .add(DAY_IN_SECONDS, 'seconds')
        .toDate();

      const claim = await PixKeyFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        { claimOpeningDate: notExpiredDate },
      );

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CLAIM_PENDING,
        claim,
      });

      jest.spyOn(Mutex.prototype, 'tryAcquire').mockResolvedValue(true);

      await controller.execute();

      expect(mockEmitKafkaService).not.toHaveBeenCalledWith(
        KAFKA_EVENTS.KEY.CLAIM_PENDING_EXPIRED,
        expect.objectContaining({
          value: expect.objectContaining({ id: pixKey.id }),
        }),
      );
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should execute successfully', async () => {
      // one day after limit
      const expiredDate = getMoment()
        .subtract(TIMESTAMP, 'seconds')
        .subtract(DAY_IN_SECONDS, 'seconds')
        .toDate();

      const claim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        { claimOpeningDate: expiredDate },
      );

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CLAIM_PENDING,
        claim,
      });

      jest.spyOn(Mutex.prototype, 'tryAcquire').mockResolvedValue(true);

      await controller.execute();

      expect(mockEmitKafkaService).toHaveBeenCalledWith(
        KAFKA_EVENTS.KEY.CLAIM_PENDING_EXPIRED,
        expect.objectContaining({
          value: expect.objectContaining({ id: pixKey.id }),
        }),
      );
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
