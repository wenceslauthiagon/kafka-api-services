import { Mutex } from 'redis-semaphore';
import { Test, TestingModule } from '@nestjs/testing';
import {
  SyncReportsOperationsCronServiceInit as Cron,
  ReportOperationModel,
} from '@zro/reports/infrastructure';
import { AppModule } from '@zro/reports/infrastructure/nest/modules/app.module';
import { ReportOperationFactory } from '@zro/test/reports/config';
import { EguardianReportGateway } from '@zro/e-guardian';

jest.mock('redis-semaphore');
jest.mock('ioredis');
jest.mock('child_process');

describe('SyncReportsOperationsCronServiceInit', () => {
  let module: TestingModule;
  let controller: Cron;

  const mockCreateReportService = jest.spyOn(
    EguardianReportGateway.prototype,
    'createReportOperation',
  );
  const mockSendReportService = jest.spyOn(
    EguardianReportGateway.prototype,
    'sendReport',
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Cron>(Cron);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.spyOn(Mutex.prototype, 'tryAcquire').mockResolvedValue(true);
    ReportOperationModel.truncate();
  });

  describe('Sync report operations', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should sync report operations successfully', async () => {
        // Mock the behavior of the rsync command
        jest
          .spyOn(require('child_process'), 'exec')
          .mockImplementation(
            (
              command: string,
              callback: (error: any, stdout: string, stderr: string) => void,
            ) => {
              callback(null, 'Rsync completed successfully', '');
            },
          );

        await ReportOperationFactory.createMany<ReportOperationModel>(
          ReportOperationModel.name,
          2,
        );

        await controller.syncReportsOperations();

        expect(mockCreateReportService).toHaveBeenCalledTimes(2);
        expect(mockSendReportService).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
