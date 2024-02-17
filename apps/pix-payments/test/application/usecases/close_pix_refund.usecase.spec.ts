import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  PixRefundEntity,
  PixRefundRepository,
  PixRefundState,
  PixRefundStatus,
} from '@zro/pix-payments/domain';
import {
  ClosePixRefundUseCase as UseCase,
  PixRefundEventEmitter,
  PixRefundNotFoundException,
  OperationService,
} from '@zro/pix-payments/application';
import { PixRefundFactory } from '@zro/test/pix-payments/config';

describe('ClosePixRefundEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixRefundEventEmitter =
      createMock<PixRefundEventEmitter>();

    const mockClosePendingPixRefundEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.closePendingPixRefund),
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

    return {
      refundRepository,
      mockUpdatePixRefundRepository,
      mockGetPixRefundByIssueIdRepository,
    };
  };

  const makeSut = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockCloseOperationService: jest.Mock = On(operationService).get(
      method((mock) => mock.createOperation),
    );

    const {
      refundRepository,
      mockGetPixRefundByIssueIdRepository,
      mockUpdatePixRefundRepository,
    } = mockRepository();
    const { eventEmitter, mockClosePendingPixRefundEvent } = mockEmitter();

    const sut = new UseCase(logger, refundRepository, eventEmitter);
    return {
      sut,
      refundRepository,
      mockGetPixRefundByIssueIdRepository,
      mockUpdatePixRefundRepository,
      mockCloseOperationService,
      mockClosePendingPixRefundEvent,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update if missing params', async () => {
      const {
        sut,
        mockGetPixRefundByIssueIdRepository,
        mockUpdatePixRefundRepository,
        mockClosePendingPixRefundEvent,
      } = makeSut();

      const testScript = () => sut.execute(null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetPixRefundByIssueIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixRefundRepository).toHaveBeenCalledTimes(0);
      expect(mockClosePendingPixRefundEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not alter status to closed if refund not exists', async () => {
      const {
        sut,
        mockGetPixRefundByIssueIdRepository,
        mockUpdatePixRefundRepository,
        mockClosePendingPixRefundEvent,
      } = makeSut();
      const { issueId, analysisDetails } =
        await PixRefundFactory.create<PixRefundEntity>(PixRefundEntity.name);
      mockGetPixRefundByIssueIdRepository.mockResolvedValueOnce(null);

      const testScript = () => sut.execute(issueId, analysisDetails);

      await expect(testScript).rejects.toThrow(PixRefundNotFoundException);
      expect(mockGetPixRefundByIssueIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixRefundRepository).toHaveBeenCalledTimes(0);
      expect(mockClosePendingPixRefundEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - should update refund successfully', async () => {
      const {
        sut,
        mockGetPixRefundByIssueIdRepository,
        mockUpdatePixRefundRepository,
        mockClosePendingPixRefundEvent,
      } = makeSut();
      const pixRefund = await PixRefundFactory.create<PixRefundEntity>(
        PixRefundEntity.name,
        {
          status: PixRefundStatus.RECEIVED,
          state: PixRefundState.RECEIVE_CONFIRMED,
        },
      );

      const { issueId, analysisDetails } = pixRefund;
      mockGetPixRefundByIssueIdRepository.mockResolvedValueOnce(pixRefund);

      const result = await sut.execute(issueId, analysisDetails);

      expect(result).toBeDefined();
      expect(result.status).toEqual(PixRefundStatus.CLOSED);
      expect(result.state).toEqual(PixRefundState.CLOSED_PENDING);
      expect(mockGetPixRefundByIssueIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixRefundRepository).toHaveBeenCalledTimes(1);
      expect(mockClosePendingPixRefundEvent).toHaveBeenCalledTimes(1);
    });
  });
});
