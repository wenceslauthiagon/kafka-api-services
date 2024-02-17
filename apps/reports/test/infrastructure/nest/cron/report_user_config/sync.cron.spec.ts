import { Mutex } from 'redis-semaphore';
import { Test, TestingModule } from '@nestjs/testing';
import {
  SyncReportsUserConfigsCronServiceInit as Cron,
  ReportUserConfigModel,
} from '@zro/reports/infrastructure';
import { AppModule } from '@zro/reports/infrastructure/nest/modules/app.module';
import { ReportUserConfigFactory } from '@zro/test/reports/config';
import { EguardianReportGateway } from '@zro/e-guardian';

jest.mock('redis-semaphore');
jest.mock('ioredis');
jest.mock('child_process');

describe('SyncReportsUserConfigsCronServiceInit', () => {
  let module: TestingModule;
  let controller: Cron;

  const mockCreateReportService = jest.spyOn(
    EguardianReportGateway.prototype,
    'createReportUserConfig',
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
    ReportUserConfigModel.truncate();
  });

  describe('Sync report user config', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should sync report user config successfully', async () => {
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

        await ReportUserConfigFactory.createMany<ReportUserConfigModel>(
          ReportUserConfigModel.name,
          3,
        );

        await controller.syncReportsUserConfigs();

        expect(mockCreateReportService).toHaveBeenCalledTimes(3);
        expect(mockSendReportService).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
