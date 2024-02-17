import { Mutex } from 'redis-semaphore';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { getMoment, KafkaService } from '@zro/common';
import { KeyState } from '@zro/pix-keys/domain';
import {
  PixKeyModel,
  SyncPortabilityPendingExpiredPixKeyCronService as Cron,
  KAFKA_EVENTS,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

jest.mock('redis-semaphore');
jest.mock('ioredis');

const DAY_IN_SECONDS = 24 * 60 * 60;
const TIMESTAMP = 30 * DAY_IN_SECONDS; // 30 days in seconds.

describe('SyncPortabilityPendingExpiredPixKeyCronService', () => {
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
    jest.spyOn(Mutex.prototype, 'tryAcquire').mockResolvedValue(true);
  });

  describe('With invalid parameters', () => {
    it('TC0001 - Should not sync portability pending if is not expired', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_PENDING,
        updatedAt: new Date(),
        canceledAt: null,
      });

      await controller.execute();

      const result = await PixKeyModel.findOne({
        where: { id: pixKey.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.canceledAt).toBeNull();
      expect(result.state).toBe(KeyState.PORTABILITY_PENDING);
    });

    it('TC0002 - Should not sync portability pending if has invalid state', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_OPENED,
        updatedAt: new Date(),
        canceledAt: null,
      });

      await controller.execute();

      const result = await PixKeyModel.findOne({
        where: { id: pixKey.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.canceledAt).toBeNull();
      expect(result.state).not.toBe(KeyState.PORTABILITY_PENDING);
      expect(result.state).not.toBe(KeyState.CANCELED);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should execute successfully', async () => {
      // one day after limit
      const expiredDate = getMoment()
        .subtract(TIMESTAMP, 'seconds')
        .subtract(DAY_IN_SECONDS, 'seconds')
        .toDate();

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_PENDING,
      });

      // force update updatedAt field
      await PixKeyModel.update(
        { updatedAt: expiredDate },
        { where: { id: pixKey.id }, silent: true },
      );

      await controller.execute();

      expect(mockEmitKafkaService).toHaveBeenCalledWith(
        KAFKA_EVENTS.KEY.PORTABILITY_PENDING_EXPIRED,
        expect.objectContaining({
          value: expect.objectContaining({
            id: pixKey.id,
          }),
        }),
      );
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
