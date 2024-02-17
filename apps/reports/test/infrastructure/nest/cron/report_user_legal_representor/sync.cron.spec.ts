import { Mutex } from 'redis-semaphore';
import { Test, TestingModule } from '@nestjs/testing';
import {
  SyncReportsUserLegalRepresentorCronServiceInit as Cron,
  ReportUserLegalRepresentorModel,
} from '@zro/reports/infrastructure';
import { AppModule } from '@zro/reports/infrastructure/nest/modules/app.module';
import { ReportUserFactory } from '@zro/test/reports/config';
import { EguardianReportGateway } from '@zro/e-guardian';

jest.mock('redis-semaphore');
jest.mock('ioredis');
jest.mock('child_process');

describe('SyncReportsUserLegalRepresentorCronServiceInit', () => {
  let module: TestingModule;
  let controller: Cron;

  const mockCreateReportService = jest.spyOn(
    EguardianReportGateway.prototype,
    'createReportUserRepresentor',
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
    ReportUserLegalRepresentorModel.truncate();
  });

  describe('Sync report user legal representor', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should sync report user legal representor successfully', async () => {
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

        await ReportUserFactory.createMany<ReportUserLegalRepresentorModel>(
          ReportUserLegalRepresentorModel.name,
          3,
        );

        await controller.syncReportsUserLegalRepresentor();

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
