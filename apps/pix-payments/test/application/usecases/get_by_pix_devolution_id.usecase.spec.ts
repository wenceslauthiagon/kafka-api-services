import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  PixDevolutionEntity,
  PixDevolutionRepository,
} from '@zro/pix-payments/domain';
import { GetPixDevolutionByIdUseCase as UseCase } from '@zro/pix-payments/application';
import { PixDevolutionFactory } from '@zro/test/pix-payments/config';

describe('GetPixDevolutionByIdUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const { devolutionRepository, mockGetPixDevolutionRepository } =
      mockRepository();

    const sut = new UseCase(logger, devolutionRepository);
    return {
      sut,
      devolutionRepository,
      mockGetPixDevolutionRepository,
    };
  };

  const mockRepository = () => {
    const devolutionRepository: PixDevolutionRepository =
      createMock<PixDevolutionRepository>();
    const mockGetPixDevolutionRepository: jest.Mock = On(
      devolutionRepository,
    ).get(method((mock) => mock.getWithDepositById));

    return {
      devolutionRepository,
      mockGetPixDevolutionRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get if missing params', async () => {
      const { sut, mockGetPixDevolutionRepository } = makeSut();

      const testScript = () => sut.execute(null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetPixDevolutionRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should get devolution by user successfully', async () => {
      const { sut, mockGetPixDevolutionRepository } = makeSut();

      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
      );
      mockGetPixDevolutionRepository.mockResolvedValue(devolution);

      const result = await sut.execute(devolution.id, devolution.user);

      expect(result).toBeDefined();
      expect(result).toMatchObject(devolution);
      expect(mockGetPixDevolutionRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should get devolution by id successfully', async () => {
      const { sut, mockGetPixDevolutionRepository } = makeSut();

      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
      );
      mockGetPixDevolutionRepository.mockResolvedValue(devolution);

      const result = await sut.execute(devolution.id);

      expect(result).toBeDefined();
      expect(result).toMatchObject(devolution);
      expect(mockGetPixDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPixDevolutionRepository).toHaveBeenCalledWith(
        devolution.id,
      );
    });
  });
});
