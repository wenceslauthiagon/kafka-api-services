import { KafkaContext } from '@nestjs/microservices';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { HolidayEntity } from '@zro/quotations/domain';
import {
  CreateHolidayMicroserviceController as Controller,
  HolidayDatabaseRepository,
} from '@zro/quotations/infrastructure';
import { AppModule } from '@zro/quotations/infrastructure/nest/modules/app.module';
import { CreateHolidayRequest } from '@zro/quotations/interface';
import { HolidayFactory } from '@zro/test/quotations/config';

describe('CreateHolidayMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  const holidayRepository = new HolidayDatabaseRepository();

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CreateHoliday', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create holiday successfully', async () => {
        const holiday = await HolidayFactory.create<HolidayEntity>(
          HolidayEntity.name,
        );

        const message: CreateHolidayRequest = {
          id: holiday.id,
          startDate: holiday.startDate,
          endDate: holiday.endDate,
          name: holiday.name,
          level: holiday.level,
          type: holiday.type,
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
