import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { HolidayEntity, HolidayRepository } from '@zro/quotations/domain';
import { CreateHolidayUseCase as UseCase } from '@zro/quotations/application';
import { HolidayFactory } from '@zro/test/quotations/config';

describe('CreateHolidayUseCase', () => {
  const holidayRepository: HolidayRepository = createMock<HolidayRepository>();
  const getHoliday: jest.Mock = On(holidayRepository).get(
    method((mock) => mock.getById),
  );
  const mockCreateHolidayService: jest.Mock = On(holidayRepository).get(
    method((mock) => mock.create),
  );

  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create holiday without params', async () => {
      const usecase = new UseCase(logger, holidayRepository);

      const testScript = () =>
        usecase.execute(null, null, null, null, null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(getHoliday).toHaveBeenCalledTimes(0);
      expect(mockCreateHolidayService).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should create holiday', async () => {
      const holiday = await HolidayFactory.create<HolidayEntity>(
        HolidayEntity.name,
      );

      getHoliday.mockResolvedValue(null);
      mockCreateHolidayService.mockResolvedValue(holiday);

      const usecase = new UseCase(logger, holidayRepository);

      const result = await usecase.execute(
        holiday.id,
        holiday.startDate,
        holiday.endDate,
        holiday.name,
        holiday.level,
        holiday.type,
      );

      expect(result).toBeDefined();
      expect(result).toMatchObject(holiday);
      expect(getHoliday).toHaveBeenCalledTimes(1);
      expect(mockCreateHolidayService).toHaveBeenCalledTimes(1);
    });
  });
});
