import { Test, TestingModule } from '@nestjs/testing';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  UpdateHolidayByIdUseCase as UseCase,
  HolidayNotFoundException,
} from '@zro/quotations/application';
import { AppModule } from '@zro/quotations/infrastructure/nest/modules/app.module';
import {
  HolidayDatabaseRepository,
  HolidayModel,
} from '@zro/quotations/infrastructure';
import { HolidayFactory } from '@zro/test/quotations/config';

describe('UpdateHolidayByIdUseCase', () => {
  let module: TestingModule;
  const holidayRepository = new HolidayDatabaseRepository();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  describe('With valid parameters', () => {
    it('TC0001 - Should update holiday by id successfully', async () => {
      const holiday = await HolidayFactory.create<HolidayModel>(
        HolidayModel.name,
      );

      const usecase = new UseCase(logger, holidayRepository);

      const updatedHoliday = await usecase.execute(
        holiday.id,
        new Date(),
        new Date(),
      );

      expect(updatedHoliday).toBeDefined();
      expect(updatedHoliday.id).toEqual(holiday.id);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should throw MissingDataException when id is missing', async () => {
      const usecase = new UseCase(logger, holidayRepository);

      await expect(
        usecase.execute(null, new Date(), new Date()),
      ).rejects.toThrow(MissingDataException);
    });

    it('TC0003 - Should throw MissingDataException when startDate is missing', async () => {
      const usecase = new UseCase(logger, holidayRepository);

      await expect(
        usecase.execute('validId', null, new Date()),
      ).rejects.toThrow(MissingDataException);
    });

    it('TC0004 - Should throw MissingDataException when endDate is missing', async () => {
      const usecase = new UseCase(logger, holidayRepository);

      await expect(
        usecase.execute('validId', new Date(), null),
      ).rejects.toThrow(MissingDataException);
    });

    it('TC0005 - Should throw HolidayNotFoundException when holiday is not found', async () => {
      const nonExistingId = 'nonExistingId';
      const usecase = new UseCase(logger, holidayRepository);

      jest.spyOn(holidayRepository, 'getById').mockResolvedValueOnce(undefined);

      await expect(
        usecase.execute(nonExistingId, new Date(), new Date()),
      ).rejects.toThrow(HolidayNotFoundException);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
