import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixInfractionEntity,
  PixInfractionRefundOperationEntity,
  PixInfractionRefundOperationRepository,
  PixInfractionRepository,
  PixInfractionState,
  PixInfractionStatus,
} from '@zro/pix-payments/domain';
import {
  HandleCancelPixInfractionReceivedEventUseCase as UseCase,
  PixInfractionEventEmitter,
  PixInfractionNotFoundException,
  OperationService,
} from '@zro/pix-payments/application';
import {
  InfractionFactory,
  PixInfractionRefundOperationFactory,
} from '@zro/test/pix-payments/config';

describe('CancelInfractionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixInfractionEventEmitter =
      createMock<PixInfractionEventEmitter>();

    const mockCancelPendingInfractionEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.cancelPendingInfractionReceived),
    );

    return {
      eventEmitter,
      mockCancelPendingInfractionEvent,
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

    const pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository =
      createMock<PixInfractionRefundOperationRepository>();
    const mockGetAllPixInfractionRefundOperation: jest.Mock = On(
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
      mockGetAllPixInfractionRefundOperation,
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
      mockGetAllPixInfractionRefundOperation,
      mockUpdatePixInfractionRefundOperation,
    } = mockRepository();

    const { eventEmitter, mockCancelPendingInfractionEvent } = mockEmitter();

    const sut = new UseCase(
      logger,
      operationService,
      infractionRepository,
      pixInfractionRefundOperationRepository,
      eventEmitter,
    );
    return {
      sut,
      infractionRepository,
      mockGetInfractionByIssueIdRepository,
      mockUpdateInfractionRepository,
      mockRevertOperationService,
      mockCancelPendingInfractionEvent,
      mockGetAllPixInfractionRefundOperation,
      mockUpdatePixInfractionRefundOperation,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update if missing params', async () => {
      const {
        sut,
        mockGetInfractionByIssueIdRepository,
        mockUpdateInfractionRepository,
        mockCancelPendingInfractionEvent,
        mockGetAllPixInfractionRefundOperation,
        mockUpdatePixInfractionRefundOperation,
      } = makeSut();

      const testScript = () => sut.execute(null, null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetInfractionByIssueIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockCancelPendingInfractionEvent).toHaveBeenCalledTimes(0);
      expect(mockGetAllPixInfractionRefundOperation).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not alter status to canceled if infraction not exists', async () => {
      const {
        sut,
        mockGetInfractionByIssueIdRepository,
        mockUpdateInfractionRepository,
        mockCancelPendingInfractionEvent,
        mockGetAllPixInfractionRefundOperation,
        mockUpdatePixInfractionRefundOperation,
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
      expect(mockCancelPendingInfractionEvent).toHaveBeenCalledTimes(0);
      expect(mockGetAllPixInfractionRefundOperation).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - should update infraction successfully', async () => {
      const {
        sut,
        mockGetInfractionByIssueIdRepository,
        mockUpdateInfractionRepository,
        mockRevertOperationService,
        mockCancelPendingInfractionEvent,
        mockGetAllPixInfractionRefundOperation,
        mockUpdatePixInfractionRefundOperation,
      } = makeSut();

      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
      );

      const { infractionPspId, analysisResult, analysisDetails } = infraction;

      const pixInfractionRefundOperation =
        await PixInfractionRefundOperationFactory.create<PixInfractionRefundOperationEntity>(
          PixInfractionRefundOperationEntity.name,
        );

      mockGetInfractionByIssueIdRepository.mockResolvedValue(infraction);
      mockGetAllPixInfractionRefundOperation.mockResolvedValue([
        pixInfractionRefundOperation,
      ]);

      const result = await sut.execute(
        infractionPspId,
        analysisResult,
        analysisDetails,
      );

      expect(result).toBeDefined();
      expect(result.status).toEqual(PixInfractionStatus.CANCELLED);
      expect(result.state).toEqual(PixInfractionState.CANCEL_PENDING);
      expect(mockGetInfractionByIssueIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockRevertOperationService).toHaveBeenCalledTimes(1);
      expect(mockCancelPendingInfractionEvent).toHaveBeenCalledTimes(1);
      expect(mockGetAllPixInfractionRefundOperation).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixInfractionRefundOperation).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - should return infraction if it already exists CANCEL_PENDING', async () => {
      const {
        sut,
        mockGetInfractionByIssueIdRepository,
        mockUpdateInfractionRepository,
        mockRevertOperationService,
        mockCancelPendingInfractionEvent,
        mockGetAllPixInfractionRefundOperation,
        mockUpdatePixInfractionRefundOperation,
      } = makeSut();

      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        { state: PixInfractionState.CANCEL_PENDING },
      );

      const { infractionPspId, analysisResult, analysisDetails } = infraction;

      mockGetInfractionByIssueIdRepository.mockResolvedValue(infraction);

      const result = await sut.execute(
        infractionPspId,
        analysisResult,
        analysisDetails,
      );

      expect(result).toBeDefined();
      expect(result.state).toEqual(PixInfractionState.CANCEL_PENDING);
      expect(mockGetInfractionByIssueIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockRevertOperationService).toHaveBeenCalledTimes(0);
      expect(mockCancelPendingInfractionEvent).toHaveBeenCalledTimes(0);
      expect(mockGetAllPixInfractionRefundOperation).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
    });
  });
});
