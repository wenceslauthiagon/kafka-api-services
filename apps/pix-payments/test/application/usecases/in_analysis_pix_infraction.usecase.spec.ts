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
  InAnalysisPixInfractionUseCase as UseCase,
  PixInfractionEventEmitter,
  PixInfractionNotFoundException,
} from '@zro/pix-payments/application';
import { InfractionFactory } from '@zro/test/pix-payments/config';

describe('InAnalysisInfractionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixInfractionEventEmitter =
      createMock<PixInfractionEventEmitter>();

    const mockInAnalysisPendingInfractionReceivedEvent: jest.Mock = On(
      eventEmitter,
    ).get(method((mock) => mock.inAnalysisConfirmedInfraction));

    return {
      eventEmitter,
      mockInAnalysisPendingInfractionReceivedEvent,
    };
  };

  const mockRepository = () => {
    const infractionRepository: PixInfractionRepository =
      createMock<PixInfractionRepository>();
    const mockUpdateInfractionRepository: jest.Mock = On(
      infractionRepository,
    ).get(method((mock) => mock.update));

    const mockGetInfractionByIssueRepository: jest.Mock = On(
      infractionRepository,
    ).get(method((mock) => mock.getByIssueId));

    return {
      infractionRepository,
      mockUpdateInfractionRepository,
      mockGetInfractionByIssueRepository,
    };
  };

  const makeSut = () => {
    const {
      infractionRepository,
      mockGetInfractionByIssueRepository,
      mockUpdateInfractionRepository,
    } = mockRepository();
    const { eventEmitter, mockInAnalysisPendingInfractionReceivedEvent } =
      mockEmitter();

    const sut = new UseCase(logger, infractionRepository, eventEmitter);
    return {
      sut,
      mockGetInfractionByIssueRepository,
      infractionRepository,
      mockUpdateInfractionRepository,
      mockInAnalysisPendingInfractionReceivedEvent,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update if missing params', async () => {
      const {
        sut,
        mockGetInfractionByIssueRepository,
        mockUpdateInfractionRepository,
        mockInAnalysisPendingInfractionReceivedEvent,
      } = makeSut();

      const testScript = () => sut.execute(null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetInfractionByIssueRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(
        mockInAnalysisPendingInfractionReceivedEvent,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not alter status to inAnalysis if infraction not exists', async () => {
      const {
        sut,
        mockGetInfractionByIssueRepository,
        mockUpdateInfractionRepository,
        mockInAnalysisPendingInfractionReceivedEvent,
      } = makeSut();
      const { issueId, description } =
        await InfractionFactory.create<PixInfractionEntity>(
          PixInfractionEntity.name,
        );
      mockGetInfractionByIssueRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(issueId, description);

      await expect(testScript).rejects.toThrow(PixInfractionNotFoundException);
      expect(mockGetInfractionByIssueRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(
        mockInAnalysisPendingInfractionReceivedEvent,
      ).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - should update infraction successfully', async () => {
      const {
        sut,
        mockGetInfractionByIssueRepository,
        mockUpdateInfractionRepository,
        mockInAnalysisPendingInfractionReceivedEvent,
      } = makeSut();
      const { issueId, description } =
        await InfractionFactory.create<PixInfractionEntity>(
          PixInfractionEntity.name,
        );

      const result = await sut.execute(issueId, description);

      expect(result).toBeDefined();
      expect(result.status).toEqual(PixInfractionStatus.IN_ANALYSIS);
      expect(result.state).toEqual(PixInfractionState.IN_ANALYSIS_CONFIRMED);
      expect(mockGetInfractionByIssueRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(1);
      expect(
        mockInAnalysisPendingInfractionReceivedEvent,
      ).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - should return infraction if it already exists CANCEL_PENDING', async () => {
      const {
        sut,
        mockGetInfractionByIssueRepository,
        mockUpdateInfractionRepository,
        mockInAnalysisPendingInfractionReceivedEvent,
      } = makeSut();
      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        { state: PixInfractionState.IN_ANALYSIS_CONFIRMED },
      );

      const { issueId, description } = infraction;

      mockGetInfractionByIssueRepository.mockResolvedValue(infraction);

      const result = await sut.execute(issueId, description);

      expect(result).toBeDefined();
      expect(result.state).toEqual(PixInfractionState.IN_ANALYSIS_CONFIRMED);
      expect(mockGetInfractionByIssueRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(
        mockInAnalysisPendingInfractionReceivedEvent,
      ).toHaveBeenCalledTimes(0);
    });
  });
});
