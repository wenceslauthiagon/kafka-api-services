import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixFraudDetectionEntity,
  PixFraudDetectionRepository,
  PixFraudDetectionState,
} from '@zro/pix-payments/domain';
import {
  HandleRegisterPendingPixFraudDetectionEventUseCase as UseCase,
  PixFraudDetectionEventEmitter,
  PixFraudDetectionInvalidStateException,
  PixFraudDetectionGateway,
  PixFraudDetectionNotFoundException,
  IssuePixFraudDetectionGateway,
} from '@zro/pix-payments/application';
import { PixFraudDetectionFactory } from '@zro/test/pix-payments/config';
import { faker } from '@faker-js/faker/locale/pt_BR';

describe('HandleRegisterPendingPixFraudDetectionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockGateway = () => {
    const pspGateway: PixFraudDetectionGateway =
      createMock<PixFraudDetectionGateway>();
    const mockCreatePspGateway: jest.Mock = On(pspGateway).get(
      method((mock) => mock.createFraudDetection),
    );

    const issueGateway: IssuePixFraudDetectionGateway =
      createMock<IssuePixFraudDetectionGateway>();
    const mockUpdateIssueGateway: jest.Mock = On(issueGateway).get(
      method((mock) => mock.updatePixFraudDetectionIssue),
    );

    return {
      pspGateway,
      mockCreatePspGateway,
      issueGateway,
      mockUpdateIssueGateway,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: PixFraudDetectionEventEmitter =
      createMock<PixFraudDetectionEventEmitter>();
    const mockEmitEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.registerConfirmedPixFraudDetection),
    );

    return {
      eventEmitter,
      mockEmitEvent,
    };
  };

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
    const {
      pspGateway,
      mockCreatePspGateway,
      issueGateway,
      mockUpdateIssueGateway,
    } = mockGateway();

    const { repository, mockGetByIdRepository, mockUpdateRepository } =
      mockRepository();

    const { eventEmitter, mockEmitEvent } = mockEmitter();

    const sut = new UseCase(
      logger,
      repository,
      pspGateway,
      issueGateway,
      eventEmitter,
    );

    return {
      sut,
      mockGetByIdRepository,
      mockUpdateRepository,
      mockEmitEvent,
      mockCreatePspGateway,
      mockUpdateIssueGateway,
    };
  };
  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException when missing params.', async () => {
      const {
        sut,
        mockGetByIdRepository,
        mockUpdateRepository,
        mockEmitEvent,
        mockCreatePspGateway,
        mockUpdateIssueGateway,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
      expect(mockCreatePspGateway).toHaveBeenCalledTimes(0);
      expect(mockUpdateIssueGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw PixFraudDetectionNotFoundException if pixFraudDetection is not found.', async () => {
      const {
        sut,
        mockGetByIdRepository,
        mockUpdateRepository,
        mockEmitEvent,
        mockCreatePspGateway,
        mockUpdateIssueGateway,
      } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
        );

      mockGetByIdRepository.mockResolvedValueOnce(null);

      const testScript = () => sut.execute(pixFraudDetection.id);

      await expect(testScript).rejects.toThrow(
        PixFraudDetectionNotFoundException,
      );
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
      expect(mockCreatePspGateway).toHaveBeenCalledTimes(0);
      expect(mockUpdateIssueGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should return if state is already REGISTERED_CONFIRMED.', async () => {
      const {
        sut,
        mockGetByIdRepository,
        mockUpdateRepository,
        mockEmitEvent,
        mockCreatePspGateway,
        mockUpdateIssueGateway,
      } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
          {
            state: PixFraudDetectionState.REGISTERED_CONFIRMED,
          },
        );

      mockGetByIdRepository.mockResolvedValueOnce(pixFraudDetection);

      const testScript = await sut.execute(pixFraudDetection.id);

      expect(testScript).toMatchObject(pixFraudDetection);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
      expect(mockCreatePspGateway).toHaveBeenCalledTimes(0);
      expect(mockUpdateIssueGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw PixFraudDetectionInvalidStateException if state is invalid.', async () => {
      const {
        sut,
        mockGetByIdRepository,
        mockUpdateRepository,
        mockEmitEvent,
        mockCreatePspGateway,
        mockUpdateIssueGateway,
      } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
          {
            state: PixFraudDetectionState.RECEIVED_PENDING,
          },
        );

      mockGetByIdRepository.mockResolvedValueOnce(pixFraudDetection);

      const testScript = () => sut.execute(pixFraudDetection.id);

      await expect(testScript).rejects.toThrow(
        PixFraudDetectionInvalidStateException,
      );
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
      expect(mockCreatePspGateway).toHaveBeenCalledTimes(0);
      expect(mockUpdateIssueGateway).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should execute pixFraudDetection successfully.', async () => {
      const {
        sut,
        mockGetByIdRepository,
        mockUpdateRepository,
        mockEmitEvent,
        mockCreatePspGateway,
        mockUpdateIssueGateway,
      } = makeSut();

      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
          {
            state: PixFraudDetectionState.REGISTERED_PENDING,
            externalId: null,
          },
        );

      const pspResult = {
        fraudDetectionId: faker.datatype.uuid(),
        status: pixFraudDetection.status,
      };

      mockGetByIdRepository.mockResolvedValueOnce(pixFraudDetection);
      mockCreatePspGateway.mockResolvedValueOnce(pspResult);

      const result = await sut.execute(pixFraudDetection.id);

      expect(result.state).toBe(PixFraudDetectionState.REGISTERED_CONFIRMED);
      expect(result.externalId).toBe(pspResult.fraudDetectionId);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockEmitEvent).toHaveBeenCalledTimes(1);
      expect(mockCreatePspGateway).toHaveBeenCalledTimes(1);
      expect(mockUpdateIssueGateway).toHaveBeenCalledTimes(1);
    });
  });
});
