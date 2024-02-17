import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger } from '@zro/common/test';
import { HolidayRepository } from '@zro/quotations/domain';
import { AppModule } from '@zro/quotations/infrastructure/nest/modules/app.module';
import {
  GetHolidayByDateMicroserviceController as Controller,
  HolidayDatabaseRepository,
  HolidayModel,
} from '@zro/quotations/infrastructure';
import { HolidayFactory } from '@zro/test/quotations/config';
import { GetHolidayByDateRequest } from '@zro/quotations/interface';

describe('GetHolidayByDateMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let holidayRepository: HolidayRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    holidayRepository = new HolidayDatabaseRepository();
  });

  describe('GetHolidayByDate', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get holiday by date successfully', async () => {
        const holiday = await HolidayFactory.create<HolidayModel>(
          HolidayModel.name,
        );

        const message: GetHolidayByDateRequest = {
          date: holiday.endDate,
        };

        const result = await controller.execute(
          holidayRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(holiday.id);
        expect(result.value.createdAt).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
