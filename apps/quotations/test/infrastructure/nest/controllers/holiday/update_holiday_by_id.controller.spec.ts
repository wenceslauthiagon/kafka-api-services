import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import {
  UpdateHolidayByIdMicroserviceController as Controller,
  HolidayDatabaseRepository,
  HolidayModel,
} from '@zro/quotations/infrastructure';
import { AppModule } from '@zro/quotations/infrastructure/nest/modules/app.module';
import { UpdateHolidayByIdRequest } from '@zro/quotations/interface';
import { HolidayFactory } from '@zro/test/quotations/config';

describe('UpdateHolidayByIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let holidayRepository: HolidayDatabaseRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    holidayRepository = new HolidayDatabaseRepository();
  });

  describe('UpdateHolidayById', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should update holiday by id successfully', async () => {
        const holiday = await HolidayFactory.create<HolidayModel>(
          HolidayModel.name,
        );

        const message: UpdateHolidayByIdRequest = {
          id: holiday.id,
          startDate: new Date(),
          endDate: new Date(),
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
        expect(result.value.startDate).toBeDefined();
        expect(result.value.endDate).toBeDefined();
      });
    });
  });

  describe('With missing parameters', () => {
    it('TC0002 - Should throw InvalidDataFormatException when id is missing', async () => {
      const message: UpdateHolidayByIdRequest = {
        id: null,
        startDate: new Date(),
        endDate: new Date(),
      };

      await expect(
        controller.execute(holidayRepository, logger, message, ctx),
      ).rejects.toThrow(InvalidDataFormatException);
    });

    it('TC0003 - Should throw InvalidDataFormatException when startDate is missing', async () => {
      const message: UpdateHolidayByIdRequest = {
        id: 'validId',
        startDate: null,
        endDate: new Date(),
      };

      await expect(
        controller.execute(holidayRepository, logger, message, ctx),
      ).rejects.toThrow(InvalidDataFormatException);
    });

    it('TC0004 - Should throw InvalidDataFormatException when endDate is missing', async () => {
      const message: UpdateHolidayByIdRequest = {
        id: 'validId',
        startDate: new Date(),
        endDate: null,
      };

      await expect(
        controller.execute(holidayRepository, logger, message, ctx),
      ).rejects.toThrow(InvalidDataFormatException);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
