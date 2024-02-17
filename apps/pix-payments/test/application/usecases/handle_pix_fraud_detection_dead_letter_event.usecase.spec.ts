import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixFraudDetectionEntity,
  PixFraudDetectionRepository,
  PixFraudDetectionState,
} from '@zro/pix-payments/domain';
import {
  HandlePixFraudDetectionDeadLetterEventUseCase as UseCase,
  PixFraudDetectionNotFoundException,
} from '@zro/pix-payments/application';
import { PixFraudDetectionFactory } from '@zro/test/pix-payments/config';

describe('HandlePixFraudDetectionDeadLetterEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockRepository = () => {
    const repository: PixFraudDetectionRepository =
      createMock<PixFraudDetectionRepository>();
    const mockGetByIdRepository: jest.Mock = On(repository).get(
      method((mock) => mock.getById),
    );
    const mockUpdateRepository: jest.Mock = On(repository).get(
      method((mock) => mock.update),
    );

    return {
      repository,
      mockGetByIdRepository,
      mockUpdateRepository,
    };
  };

  const makeSut = () => {
    const { repository, mockGetByIdRepository, mockUpdateRepository } =
      mockRepository();

    const sut = new UseCase(logger, repository);

    return {
      sut,
      mockGetByIdRepository,
      mockUpdateRepository,
    };
  };
  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException if there is missing data.', async () => {
      const { sut, mockGetByIdRepository, mockUpdateRepository } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw PixFraudDetectionNotFoundException if pixFraudDetection is not found.', async () => {
      const { sut, mockGetByIdRepository, mockUpdateRepository } = makeSut();

      mockGetByIdRepository.mockResolvedValueOnce(null);

      const testScript = () => sut.execute('test');

      await expect(testScript).rejects.toThrow(
        PixFraudDetectionNotFoundException,
      );
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should return if state is already failed.', async () => {
      const { sut, mockGetByIdRepository, mockUpdateRepository } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
          {
            state: PixFraudDetectionState.FAILED,
          },
        );

      mockGetByIdRepository.mockResolvedValueOnce(pixFraudDetection);

      await sut.execute(pixFraudDetection.id);

      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should execute pixFraudDetection successfully.', async () => {
      const { sut, mockGetByIdRepository, mockUpdateRepository } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
        );

      mockGetByIdRepository.mockResolvedValueOnce(pixFraudDetection);

      await sut.execute(pixFraudDetection.id);

      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
    });
  });
});
