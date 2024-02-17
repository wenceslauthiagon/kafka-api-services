import { Mutex } from 'redis-semaphore';
import { Test, TestingModule } from '@nestjs/testing';
import {
  SyncCreateOperationIndexCronService as Cron,
  OperationsIndexModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { getMoment } from '@zro/common';

jest.mock('redis-semaphore');
jest.mock('ioredis');

describe('SyncCreateOperationIndexCronService', () => {
  let module: TestingModule;
  let controller: Cron;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Cron>(Cron);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should execute successfully', async () => {
      jest.spyOn(Mutex.prototype, 'tryAcquire').mockResolvedValue(true);

      await controller.execute();

      const oneMonthAfterToday = getMoment().add(1, 'month');

      const year = oneMonthAfterToday.year();
      const month = oneMonthAfterToday.month();

      const indexName = `Operations_created_at_index_${year}_${month + 1}`;

      const result = await OperationsIndexModel.findOne({
        where: { indexname: indexName },
      });

      expect(result).toBeDefined();
      expect(result.indexName).toBe(indexName);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
