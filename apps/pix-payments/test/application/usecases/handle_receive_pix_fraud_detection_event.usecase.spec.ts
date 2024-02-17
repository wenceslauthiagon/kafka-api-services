import { cpf } from 'cpf-cnpj-validator';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixFraudDetectionEntity,
  PixFraudDetectionRepository,
  PixFraudDetectionStatus,
  PixFraudDetectionType,
} from '@zro/pix-payments/domain';
import {
  HandleReceivePixFraudDetectionEventUseCase as UseCase,
  PixFraudDetectionEventEmitter,
  PixFraudDetectionInvalidStatusException,
} from '@zro/pix-payments/application';
import { PixFraudDetectionFactory } from '@zro/test/pix-payments/config';

describe('HandleReceivePixFraudDetectionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixFraudDetectionEventEmitter =
      createMock<PixFraudDetectionEventEmitter>();
    const mockReceivedPendingEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.receivedPendingPixFraudDetection),
    );

    return {
      eventEmitter,
      mockReceivedPendingEvent,
    };
  };

  const mockRepository = () => {
    const repository: PixFraudDetectionRepository =
      createMock<PixFraudDetectionRepository>();
    const mockGetByExternalIdRepository: jest.Mock = On(repository).get(
      method((mock) => mock.getByExternalId),
    );
    const mockCreateRepository: jest.Mock = On(repository).get(
      method((mock) => mock.create),
    );

    return {
      repository,
      mockGetByExternalIdRepository,
      mockCreateRepository,
    };
  };

  const makeSut = () => {
    const { repository, mockGetByExternalIdRepository, mockCreateRepository } =
      mockRepository();

    const { eventEmitter, mockReceivedPendingEvent } = mockEmitter();

    const sut = new UseCase(logger, repository, eventEmitter);

    return {
      sut,
      mockGetByExternalIdRepository,
      mockCreateRepository,
      mockReceivedPendingEvent,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException if there is missing data.', async () => {
      const {
        sut,
        mockGetByExternalIdRepository,
        mockCreateRepository,
        mockReceivedPendingEvent,
      } = makeSut();

      const testScripts = [
        () => sut.execute(null, null, null, null),
        () =>
          sut.execute(
            null,
            cpf.generate(),
            PixFraudDetectionType.OTHER,
            PixFraudDetectionStatus.REGISTERED,
          ),
        () =>
          sut.execute(
            faker.datatype.uuid(),
            null,
            PixFraudDetectionType.OTHER,
            PixFraudDetectionStatus.REGISTERED,
          ),
        () =>
          sut.execute(
            faker.datatype.uuid(),
            cpf.generate(),
            null,
            PixFraudDetectionStatus.REGISTERED,
          ),
        () =>
          sut.execute(
            faker.datatype.uuid(),
            cpf.generate(),
            PixFraudDetectionType.OTHER,
            null,
          ),
      ];

      for (const testScript of testScripts) {
        await expect(testScript).rejects.toThrow(MissingDataException);
        expect(mockGetByExternalIdRepository).toHaveBeenCalledTimes(0);
        expect(mockCreateRepository).toHaveBeenCalledTimes(0);
        expect(mockReceivedPendingEvent).toHaveBeenCalledTimes(0);
      }
    });

    it('TC0002 - Should return if pixFraudDetection already exists.', async () => {
      const {
        sut,
        mockGetByExternalIdRepository,
        mockCreateRepository,
        mockReceivedPendingEvent,
      } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
        );

      mockGetByExternalIdRepository.mockResolvedValue(pixFraudDetection);

      await sut.execute(
        pixFraudDetection.externalId,
        pixFraudDetection.document,
        pixFraudDetection.fraudType,
        pixFraudDetection.status,
      );

      expect(mockGetByExternalIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockReceivedPendingEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw PixFraudDetectionInvalidStatusException if state is invalid.', async () => {
      const {
        sut,
        mockGetByExternalIdRepository,
        mockCreateRepository,
        mockReceivedPendingEvent,
      } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
          { status: PixFraudDetectionStatus.CANCELED_REGISTERED },
        );

      mockGetByExternalIdRepository.mockResolvedValue(null);

      const testScript = () =>
        sut.execute(
          pixFraudDetection.externalId,
          pixFraudDetection.document,
          pixFraudDetection.fraudType,
          pixFraudDetection.status,
        );

      await expect(testScript).rejects.toThrow(
        PixFraudDetectionInvalidStatusException,
      );
      expect(mockGetByExternalIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockReceivedPendingEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should execute pixFraudDetection successfully.', async () => {
      const {
        sut,
        mockGetByExternalIdRepository,
        mockCreateRepository,
        mockReceivedPendingEvent,
      } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
          { status: PixFraudDetectionStatus.REGISTERED },
        );

      mockGetByExternalIdRepository.mockResolvedValue(null);

      await sut.execute(
        pixFraudDetection.externalId,
        pixFraudDetection.document,
        pixFraudDetection.fraudType,
        pixFraudDetection.status,
      );

      expect(mockGetByExternalIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledTimes(1);
      expect(mockReceivedPendingEvent).toHaveBeenCalledTimes(1);
    });
  });
});
