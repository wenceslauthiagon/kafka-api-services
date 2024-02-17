import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  PixInfractionEntity,
  PixInfractionRepository,
} from '@zro/pix-payments/domain';
import { GetPixInfractionByPspIdUseCase as UseCase } from '@zro/pix-payments/application';
import { InfractionFactory } from '@zro/test/pix-payments/config';

describe('GetPixInfractionByPspIdUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const { infractionRepository, mockGetInfractionRepository } =
      mockRepository();

    const sut = new UseCase(logger, infractionRepository);
    return {
      sut,
      infractionRepository,
      mockGetInfractionRepository,
    };
  };

  const mockRepository = () => {
    const infractionRepository: PixInfractionRepository =
      createMock<PixInfractionRepository>();
    const mockGetInfractionRepository: jest.Mock = On(infractionRepository).get(
      method((mock) => mock.getByInfractionPspId),
    );

    return {
      infractionRepository,
      mockGetInfractionRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get if missing params', async () => {
      const { sut, mockGetInfractionRepository } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetInfractionRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should get infraction by psp id successfully', async () => {
      const { sut, mockGetInfractionRepository } = makeSut();
      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
      );
      mockGetInfractionRepository.mockResolvedValue(infraction);

      const result = await sut.execute(infraction.id);

      expect(result).toBeDefined();
      expect(result).toMatchObject(infraction);
      expect(mockGetInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetInfractionRepository).toHaveBeenCalledWith(infraction.id);
    });
  });
});
