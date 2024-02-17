import { Mutex } from 'redis-semaphore';
import { Test, TestingModule } from '@nestjs/testing';
import {
  SyncDeleteOperationIndexCronService as Cron,
  OperationsIndexModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { Op } from 'sequelize';
import { getMoment } from '@zro/common';

jest.mock('redis-semaphore');
jest.mock('ioredis');

describe('SyncDeleteOperationIndexCronService', () => {
  let module: TestingModule;
  let controller: Cron;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Cron>(Cron);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should execute successfully', async () => {
      const dateBeforeFiveYearsAgo = getMoment({
        year: 2017,
        month: 7,
      });

      const year = dateBeforeFiveYearsAgo.year();
      const month = dateBeforeFiveYearsAgo.month();

      const initialDate = dateBeforeFiveYearsAgo.startOf('month').toDate();
      const lastDate = dateBeforeFiveYearsAgo.endOf('month').toDate();

      const indexName = `Operations_created_at_index_${year}_${month + 1}`;

      await OperationsIndexModel.sequelize
        .getQueryInterface()
        .addIndex('Operations', ['created_at'], {
          where: {
            created_at: {
              [Op.between]: [initialDate, lastDate],
            },
          },
          name: indexName,
        });

      jest.spyOn(Mutex.prototype, 'tryAcquire').mockResolvedValue(true);

      await controller.execute();

      const result = await OperationsIndexModel.findOne({
        where: { indexname: indexName },
      });

      expect(result).toBeNull();
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
