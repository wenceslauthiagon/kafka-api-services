import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  PixInfractionAnalysisResultType,
  PixInfractionEntity,
  PixInfractionRefundOperationEntity,
  PixInfractionRefundOperationRepository,
  PixInfractionRepository,
  PixInfractionState,
  PixInfractionStatus,
  PixInfractionType,
} from '@zro/pix-payments/domain';
import {
  ClosePixInfractionUseCase as UseCase,
  PixInfractionEventEmitter,
  PixInfractionNotFoundException,
  OperationService,
} from '@zro/pix-payments/application';
import {
  InfractionFactory,
  PixInfractionRefundOperationFactory,
} from '@zro/test/pix-payments/config';

describe('CloseInfractionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixInfractionEventEmitter =
      createMock<PixInfractionEventEmitter>();

    const mockClosePendingInfractionEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.closedPendingInfraction),
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
    ).get(method((mock) => mock.getByIssueId));

    const pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository =
      createMock<PixInfractionRefundOperationRepository>();
    const mockGetAllPixInfractionRefundOperationByFilter: jest.Mock = On(
      pixInfractionRefundOperationRepository,
    ).get(method((mock) => mock.getAllByFilter));
    const mockUpdatePixInfractionRefundOperation: jest.Mock = On(
      pixInfractionRefundOperationRepository,
    ).get(method((mock) => mock.update));

    return {
      infractionRepository,
      mockUpdateInfractionRepository,
      mockGetInfractionByIssueIdRepository,
      pixInfractionRefundOperationRepository,
      mockGetAllPixInfractionRefundOperationByFilter,
      mockUpdatePixInfractionRefundOperation,
    };
  };

  const makeSut = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockRevertOperationService: jest.Mock = On(operationService).get(
      method((mock) => mock.revertOperation),
    );

    const {
      infractionRepository,
      mockGetInfractionByIssueIdRepository,
      mockUpdateInfractionRepository,
      pixInfractionRefundOperationRepository,
      mockGetAllPixInfractionRefundOperationByFilter,
      mockUpdatePixInfractionRefundOperation,
    } = mockRepository();
    const { eventEmitter, mockClosePendingInfractionEvent } = mockEmitter();

    const sut = new UseCase(
      logger,
      infractionRepository,
      pixInfractionRefundOperationRepository,
      eventEmitter,
      operationService,
    );
    return {
      sut,
      infractionRepository,
      mockGetInfractionByIssueIdRepository,
      mockUpdateInfractionRepository,
      mockRevertOperationService,
      mockClosePendingInfractionEvent,
      mockGetAllPixInfractionRefundOperationByFilter,
      mockUpdatePixInfractionRefundOperation,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update if missing params', async () => {
      const {
        sut,
        mockGetInfractionByIssueIdRepository,
        mockUpdateInfractionRepository,
        mockClosePendingInfractionEvent,
        mockGetAllPixInfractionRefundOperationByFilter,
        mockUpdatePixInfractionRefundOperation,
        mockRevertOperationService,
      } = makeSut();

      const testScript = () => sut.execute(null, null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetInfractionByIssueIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockClosePendingInfractionEvent).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
      expect(mockRevertOperationService).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not alter status to closed if infraction not exists', async () => {
      const {
        sut,
        mockGetInfractionByIssueIdRepository,
        mockUpdateInfractionRepository,
        mockClosePendingInfractionEvent,
        mockGetAllPixInfractionRefundOperationByFilter,
        mockUpdatePixInfractionRefundOperation,
        mockRevertOperationService,
      } = makeSut();

      const { issueId, analysisResult, analysisDetails } =
        await InfractionFactory.create<PixInfractionEntity>(
          PixInfractionEntity.name,
        );

      mockGetInfractionByIssueIdRepository.mockResolvedValue(null);

      const testScript = () =>
        sut.execute(issueId, analysisResult, analysisDetails);

      await expect(testScript).rejects.toThrow(PixInfractionNotFoundException);
      expect(mockGetInfractionByIssueIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockClosePendingInfractionEvent).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
      expect(mockRevertOperationService).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not alter status to closed if infraction state is already CLOSED_PENDING.', async () => {
      const {
        sut,
        mockGetInfractionByIssueIdRepository,
        mockUpdateInfractionRepository,
        mockClosePendingInfractionEvent,
        mockGetAllPixInfractionRefundOperationByFilter,
        mockUpdatePixInfractionRefundOperation,
        mockRevertOperationService,
      } = makeSut();

      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        {
          state: PixInfractionState.CLOSED_PENDING,
        },
      );
      mockGetInfractionByIssueIdRepository.mockResolvedValue(infraction);

      await sut.execute(
        infraction.issueId,
        infraction.analysisResult,
        infraction.analysisDetails,
      );

      expect(mockGetInfractionByIssueIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockClosePendingInfractionEvent).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
      expect(mockRevertOperationService).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should update infraction successfully', async () => {
      const {
        sut,
        mockGetInfractionByIssueIdRepository,
        mockUpdateInfractionRepository,
        mockClosePendingInfractionEvent,
        mockGetAllPixInfractionRefundOperationByFilter,
        mockUpdatePixInfractionRefundOperation,
        mockRevertOperationService,
      } = makeSut();

      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        {
          infractionType: PixInfractionType.REFUND_REQUEST,
          analysisResult: PixInfractionAnalysisResultType.DISAGREED,
        },
      );
      const { issueId, analysisResult, analysisDetails } = infraction;

      mockGetInfractionByIssueIdRepository.mockResolvedValue(infraction);

      const pixInfractionRefundOperation =
        await PixInfractionRefundOperationFactory.create<PixInfractionRefundOperationEntity>(
          PixInfractionRefundOperationEntity.name,
        );

      mockGetAllPixInfractionRefundOperationByFilter.mockResolvedValue([
        pixInfractionRefundOperation,
      ]);

      const result = await sut.execute(
        issueId,
        analysisResult,
        analysisDetails,
      );

      expect(result).toBeDefined();
      expect(result.status).toEqual(PixInfractionStatus.CLOSED);
      expect(result.state).toEqual(PixInfractionState.CLOSED_PENDING);
      expect(mockGetInfractionByIssueIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockClosePendingInfractionEvent).toHaveBeenCalledTimes(1);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixInfractionRefundOperation).toHaveBeenCalledTimes(1);
      expect(mockRevertOperationService).toHaveBeenCalledTimes(1);
    });
  });
});
