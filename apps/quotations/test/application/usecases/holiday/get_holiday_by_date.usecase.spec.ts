import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { GetHolidayByDateUseCase as UseCase } from '@zro/quotations/application';
import { AppModule } from '@zro/quotations/infrastructure/nest/modules/app.module';
import {
  HolidayDatabaseRepository,
  HolidayModel,
} from '@zro/quotations/infrastructure';
import { HolidayFactory } from '@zro/test/quotations/config';

describe('GetHolidayByDateUseCase', () => {
  let module: TestingModule;
  const holidayRepository = new HolidayDatabaseRepository();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  describe('With valid parameters', () => {
    it('TC0001 - Should get holiday by date successfully', async () => {
      const holiday = await HolidayFactory.create<HolidayModel>(
        HolidayModel.name,
      );

      const usecase = new UseCase(logger, holidayRepository);

      const result = await usecase.execute(holiday.endDate);

      expect(result).toBeDefined();
      expect(result).toMatchObject(holiday.toDomain());
    });

    it('TC0002 - Should not get holiday by different date', async () => {
      const usecase = new UseCase(logger, holidayRepository);

      const result = await usecase.execute(new Date());

      expect(result).toBeNull();
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
