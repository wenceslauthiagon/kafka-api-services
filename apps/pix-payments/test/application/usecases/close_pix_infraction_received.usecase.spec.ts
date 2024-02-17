import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  PixInfractionAnalysisResultType,
  PixInfractionEntity,
  PixInfractionRepository,
  PixInfractionState,
  PixInfractionStatus,
  PixInfractionType,
} from '@zro/pix-payments/domain';
import {
  HandleClosePixInfractionReceivedEventUseCase as UseCase,
  PixInfractionEventEmitter,
  PixInfractionNotFoundException,
} from '@zro/pix-payments/application';
import { InfractionFactory } from '@zro/test/pix-payments/config';

describe('CloseInfractionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixInfractionEventEmitter =
      createMock<PixInfractionEventEmitter>();

    const mockClosePendingInfractionEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.closedPendingInfractionReceived),
    );

    return {
      eventEmitter,
      mockClosePendingInfractionEvent,
    };
  };

  const mockRepository = () => {
    const infractionRepository: PixInfractionRepository =
      createMock<PixInfractionRepository>();
    const mockUpdateInfractionRepository: jest.Mock = On(
      infractionRepository,
    ).get(method((mock) => mock.update));

    const mockGetInfractionByIssueIdRepository: jest.Mock = On(
      infractionRepository,
    ).get(method((mock) => mock.getByInfractionPspId));

    return {
      infractionRepository,
      mockUpdateInfractionRepository,
      mockGetInfractionByIssueIdRepository,
    };
  };

  const makeSut = () => {
    const {
      infractionRepository,
      mockGetInfractionByIssueIdRepository,
      mockUpdateInfractionRepository,
    } = mockRepository();
    const { eventEmitter, mockClosePendingInfractionEvent } = mockEmitter();

    const sut = new UseCase(logger, infractionRepository, eventEmitter);
    return {
      sut,
      infractionRepository,
      mockGetInfractionByIssueIdRepository,
      mockUpdateInfractionRepository,
      mockClosePendingInfractionEvent,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update if missing params', async () => {
      const {
        sut,
        mockGetInfractionByIssueIdRepository,
        mockUpdateInfractionRepository,
        mockClosePendingInfractionEvent,
      } = makeSut();

      const testScript = () => sut.execute(null, null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetInfractionByIssueIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockClosePendingInfractionEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not alter status to closed if infraction not exists', async () => {
      const {
        sut,
        mockGetInfractionByIssueIdRepository,
        mockUpdateInfractionRepository,
        mockClosePendingInfractionEvent,
      } = makeSut();
      const { infractionPspId, analysisResult, analysisDetails } =
        await InfractionFactory.create<PixInfractionEntity>(
          PixInfractionEntity.name,
        );
      mockGetInfractionByIssueIdRepository.mockResolvedValue(null);

      const testScript = () =>
        sut.execute(infractionPspId, analysisResult, analysisDetails);

      await expect(testScript).rejects.toThrow(PixInfractionNotFoundException);
      expect(mockGetInfractionByIssueIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockClosePendingInfractionEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - should update infraction successfully with type fraud', async () => {
      const {
        sut,
        mockGetInfractionByIssueIdRepository,
        mockUpdateInfractionRepository,
        mockClosePendingInfractionEvent,
      } = makeSut();
      const { infractionPspId, analysisResult, analysisDetails } =
        await InfractionFactory.create<PixInfractionEntity>(
          PixInfractionEntity.name,
          {
            infractionType: PixInfractionType.FRAUD,
          },
        );
      const result = await sut.execute(
        infractionPspId,
        analysisResult,
        analysisDetails,
      );

      expect(result).toBeDefined();
      expect(result.status).toEqual(PixInfractionStatus.CLOSED);
      expect(result.state).toEqual(PixInfractionState.CLOSED_PENDING);
      expect(mockGetInfractionByIssueIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockClosePendingInfractionEvent).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - should update infraction successfully with type request refund', async () => {
      const {
        sut,
        mockGetInfractionByIssueIdRepository,
        mockUpdateInfractionRepository,
        mockClosePendingInfractionEvent,
      } = makeSut();

      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        {
          infractionType: PixInfractionType.REFUND_REQUEST,
          analysisResult: PixInfractionAnalysisResultType.DISAGREED,
        },
      );

      const { infractionPspId, analysisResult, analysisDetails } = infraction;

      mockGetInfractionByIssueIdRepository.mockResolvedValue(infraction);

      const result = await sut.execute(
        infractionPspId,
        analysisResult,
        analysisDetails,
      );

      expect(result).toBeDefined();
      expect(result.status).toEqual(PixInfractionStatus.CLOSED);
      expect(result.state).toEqual(PixInfractionState.CLOSED_PENDING);
      expect(mockGetInfractionByIssueIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockClosePendingInfractionEvent).toHaveBeenCalledTimes(1);
    });

    it('TC0005 - should return infraction if it already exists CLOSED_PENDING', async () => {
      const {
        sut,
        mockGetInfractionByIssueIdRepository,
        mockUpdateInfractionRepository,
        mockClosePendingInfractionEvent,
      } = makeSut();

      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        {
          state: PixInfractionState.CLOSED_PENDING,
        },
      );

      const { infractionPspId, analysisResult, analysisDetails } = infraction;

      mockGetInfractionByIssueIdRepository.mockResolvedValue(infraction);

      const result = await sut.execute(
        infractionPspId,
        analysisResult,
        analysisDetails,
      );

      expect(result).toBeDefined();
      expect(result.state).toEqual(PixInfractionState.CLOSED_PENDING);
      expect(mockGetInfractionByIssueIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockClosePendingInfractionEvent).toHaveBeenCalledTimes(0);
    });
  });
});
