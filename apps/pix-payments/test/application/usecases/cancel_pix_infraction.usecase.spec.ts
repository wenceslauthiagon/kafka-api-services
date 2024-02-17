import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixInfractionEntity,
  PixInfractionRepository,
  PixInfractionState,
  PixInfractionStatus,
} from '@zro/pix-payments/domain';
import {
  CancelPixInfractionUseCase as UseCase,
  PixInfractionEventEmitter,
  PixInfractionNotFoundException,
} from '@zro/pix-payments/application';
import { InfractionFactory } from '@zro/test/pix-payments/config';

describe('CancelInfractionUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixInfractionEventEmitter =
      createMock<PixInfractionEventEmitter>();

    const mockPendingCancelInfractionEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.cancelPendingInfraction),
    );

    return {
      eventEmitter,
      mockPendingCancelInfractionEvent,
    };
  };

  const mockRepository = () => {
    const infractionRepository: PixInfractionRepository =
      createMock<PixInfractionRepository>();
    const mockUpdateInfractionRepository: jest.Mock = On(
      infractionRepository,
    ).get(method((mock) => mock.update));

    const mockGetByIssueIdInfractionRepository: jest.Mock = On(
      infractionRepository,
    ).get(method((mock) => mock.getByIssueId));

    return {
      infractionRepository,
      mockUpdateInfractionRepository,
      mockGetByIssueIdInfractionRepository,
    };
  };

  const makeSut = () => {
    const {
      infractionRepository,
      mockUpdateInfractionRepository,
      mockGetByIssueIdInfractionRepository,
    } = mockRepository();

    const { eventEmitter, mockPendingCancelInfractionEvent } = mockEmitter();

    const sut = new UseCase(logger, infractionRepository, eventEmitter);

    return {
      sut,
      infractionRepository,
      mockUpdateInfractionRepository,
      mockGetByIssueIdInfractionRepository,
      mockPendingCancelInfractionEvent,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update if missing params', async () => {
      const {
        sut,
        mockGetByIssueIdInfractionRepository,
        mockUpdateInfractionRepository,
        mockPendingCancelInfractionEvent,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetByIssueIdInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingCancelInfractionEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not update if infraction not exists', async () => {
      const {
        sut,
        mockGetByIssueIdInfractionRepository,
        mockUpdateInfractionRepository,
        mockPendingCancelInfractionEvent,
      } = makeSut();

      const { issueId } = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
      );

      mockGetByIssueIdInfractionRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(issueId);

      await expect(testScript).rejects.toThrow(PixInfractionNotFoundException);
      expect(mockGetByIssueIdInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingCancelInfractionEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - should cancel infraction successfully', async () => {
      const {
        sut,
        mockGetByIssueIdInfractionRepository,
        mockUpdateInfractionRepository,
        mockPendingCancelInfractionEvent,
      } = makeSut();

      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
      );

      mockGetByIssueIdInfractionRepository.mockResolvedValue(infraction);

      const result = await sut.execute(infraction.issueId);

      expect(result).toBeDefined();
      expect(result.status).toEqual(PixInfractionStatus.CANCELLED);
      expect(result.state).toEqual(PixInfractionState.CANCEL_PENDING);
      expect(mockGetByIssueIdInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockPendingCancelInfractionEvent).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - should return infraction if it already exists CANCEL_PENDING', async () => {
      const {
        sut,
        mockGetByIssueIdInfractionRepository,
        mockUpdateInfractionRepository,
        mockPendingCancelInfractionEvent,
      } = makeSut();

      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        { state: PixInfractionState.CANCEL_PENDING },
      );

      mockGetByIssueIdInfractionRepository.mockResolvedValue(infraction);

      const result = await sut.execute(infraction.issueId);

      expect(result).toBeDefined();
      expect(result.state).toEqual(PixInfractionState.CANCEL_PENDING);
      expect(mockGetByIssueIdInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingCancelInfractionEvent).toHaveBeenCalledTimes(0);
    });
  });
});
