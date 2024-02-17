import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixInfractionRefundOperationEntity,
  PixInfractionRefundOperationRepository,
  PixRefundEntity,
  PixRefundRepository,
  PixRefundState,
  PixRefundStatus,
} from '@zro/pix-payments/domain';
import {
  CancelPixRefundUseCase as UseCase,
  OperationService,
  PixRefundEventEmitter,
  PixRefundNotFoundException,
} from '@zro/pix-payments/application';
import {
  PixInfractionRefundOperationFactory,
  PixRefundFactory,
} from '@zro/test/pix-payments/config';

describe('CancelPixRefundEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixRefundEventEmitter =
      createMock<PixRefundEventEmitter>();

    const mockClosePendingPixRefundEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.cancelPendingPixRefund),
    );

    return {
      eventEmitter,
      mockClosePendingPixRefundEvent,
    };
  };

  const mockRepository = () => {
    const refundRepository: PixRefundRepository =
      createMock<PixRefundRepository>();
    const mockUpdatePixRefundRepository: jest.Mock = On(refundRepository).get(
      method((mock) => mock.update),
    );

    const mockGetPixRefundByIssueIdRepository: jest.Mock = On(
      refundRepository,
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
      refundRepository,
      mockUpdatePixRefundRepository,
      mockGetPixRefundByIssueIdRepository,
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
      refundRepository,
      mockGetPixRefundByIssueIdRepository,
      mockUpdatePixRefundRepository,
      pixInfractionRefundOperationRepository,
      mockGetAllPixInfractionRefundOperationByFilter,
      mockUpdatePixInfractionRefundOperation,
    } = mockRepository();
    const { eventEmitter, mockClosePendingPixRefundEvent } = mockEmitter();

    const sut = new UseCase(
      logger,
      refundRepository,
      pixInfractionRefundOperationRepository,
      eventEmitter,
      operationService,
    );
    return {
      sut,
      refundRepository,
      mockGetPixRefundByIssueIdRepository,
      mockUpdatePixRefundRepository,
      mockClosePendingPixRefundEvent,
      mockRevertOperationService,
      mockGetAllPixInfractionRefundOperationByFilter,
      mockUpdatePixInfractionRefundOperation,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update if missing params', async () => {
      const {
        sut,
        mockGetPixRefundByIssueIdRepository,
        mockUpdatePixRefundRepository,
        mockClosePendingPixRefundEvent,
        mockRevertOperationService,
        mockGetAllPixInfractionRefundOperationByFilter,
        mockUpdatePixInfractionRefundOperation,
      } = makeSut();

      const testScript = () => sut.execute(null, null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetPixRefundByIssueIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixRefundRepository).toHaveBeenCalledTimes(0);
      expect(mockClosePendingPixRefundEvent).toHaveBeenCalledTimes(0);
      expect(mockRevertOperationService).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not alter status to canceld if refund not exists', async () => {
      const {
        sut,
        mockGetPixRefundByIssueIdRepository,
        mockUpdatePixRefundRepository,
        mockClosePendingPixRefundEvent,
        mockRevertOperationService,
        mockGetAllPixInfractionRefundOperationByFilter,
        mockUpdatePixInfractionRefundOperation,
      } = makeSut();
      const { issueId, analysisDetails, rejectionReason } =
        await PixRefundFactory.create<PixRefundEntity>(PixRefundEntity.name);
      mockGetPixRefundByIssueIdRepository.mockResolvedValueOnce(null);

      const testScript = () =>
        sut.execute(issueId, analysisDetails, rejectionReason);

      await expect(testScript).rejects.toThrow(PixRefundNotFoundException);
      expect(mockGetPixRefundByIssueIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixRefundRepository).toHaveBeenCalledTimes(0);
      expect(mockClosePendingPixRefundEvent).toHaveBeenCalledTimes(0);
      expect(mockRevertOperationService).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - should update refund successfully', async () => {
      const {
        sut,
        mockGetPixRefundByIssueIdRepository,
        mockUpdatePixRefundRepository,
        mockClosePendingPixRefundEvent,
        mockRevertOperationService,
        mockGetAllPixInfractionRefundOperationByFilter,
        mockUpdatePixInfractionRefundOperation,
      } = makeSut();
      const pixRefund = await PixRefundFactory.create<PixRefundEntity>(
        PixRefundEntity.name,
        {
          status: PixRefundStatus.RECEIVED,
          state: PixRefundState.RECEIVE_CONFIRMED,
        },
      );

      const pixInfractionRefundOperation =
        await PixInfractionRefundOperationFactory.create<PixInfractionRefundOperationEntity>(
          PixInfractionRefundOperationEntity.name,
          {
            pixRefund,
          },
        );

      const { issueId, analysisDetails, rejectionReason } = pixRefund;
      mockGetPixRefundByIssueIdRepository.mockResolvedValueOnce(pixRefund);

      mockGetAllPixInfractionRefundOperationByFilter.mockResolvedValue([
        pixInfractionRefundOperation,
      ]);

      const result = await sut.execute(
        issueId,
        analysisDetails,
        rejectionReason,
      );

      expect(result).toBeDefined();
      expect(result.status).toEqual(PixRefundStatus.CANCELLED);
      expect(result.state).toEqual(PixRefundState.CANCEL_PENDING);
      expect(mockGetPixRefundByIssueIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixRefundRepository).toHaveBeenCalledTimes(1);
      expect(mockClosePendingPixRefundEvent).toHaveBeenCalledTimes(1);
      expect(mockRevertOperationService).toHaveBeenCalledTimes(1);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixInfractionRefundOperation).toHaveBeenCalledTimes(1);
    });
  });
});
