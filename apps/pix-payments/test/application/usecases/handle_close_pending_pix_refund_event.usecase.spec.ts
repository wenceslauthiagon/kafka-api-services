import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixRefundDevolutionRepository,
  PixRefundEntity,
  PixRefundRepository,
  PixRefundState,
  PixRefundStatus,
} from '@zro/pix-payments/domain';
import {
  HandleClosePendingPixRefundEventUseCase as UseCase,
  PixRefundDevolutionEventEmitter,
  PixRefundEventEmitter,
  PixRefundInvalidStateException,
  PixRefundNotFoundException,
} from '@zro/pix-payments/application';
import { PixRefundFactory } from '@zro/test/pix-payments/config';

describe('HandleClosePendingRefundEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixRefundEventEmitter =
      createMock<PixRefundEventEmitter>();

    const mockCloseConfirmedRefundEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.closeWaitingPixRefund),
    );

    const eventRefundDevolutionEmitter: PixRefundDevolutionEventEmitter =
      createMock<PixRefundDevolutionEventEmitter>();

    const mockCreateRefundDevolutionEvent: jest.Mock = On(
      eventRefundDevolutionEmitter,
    ).get(method((mock) => mock.createRefundDevolution));

    return {
      eventEmitter,
      eventRefundDevolutionEmitter,
      mockCloseConfirmedRefundEvent,
      mockCreateRefundDevolutionEvent,
    };
  };

  const mockRepository = () => {
    const refundRepository: PixRefundRepository =
      createMock<PixRefundRepository>();
    const mockUpdateRefundRepository: jest.Mock = On(refundRepository).get(
      method((mock) => mock.update),
    );
    const mockGetByIdRefundRepository: jest.Mock = On(refundRepository).get(
      method((mock) => mock.getById),
    );

    const refundDevolutionRepository: PixRefundDevolutionRepository =
      createMock<PixRefundDevolutionRepository>();

    return {
      refundRepository,
      refundDevolutionRepository,
      mockUpdateRefundRepository,
      mockGetByIdRefundRepository,
    };
  };

  const makeSut = () => {
    const {
      refundRepository,
      mockUpdateRefundRepository,
      mockGetByIdRefundRepository,
    } = mockRepository();

    const {
      eventEmitter,
      mockCloseConfirmedRefundEvent,
      eventRefundDevolutionEmitter,
      mockCreateRefundDevolutionEvent,
    } = mockEmitter();

    const sut = new UseCase(
      logger,
      refundRepository,
      eventEmitter,
      eventRefundDevolutionEmitter,
    );
    return {
      sut,
      refundRepository,
      mockUpdateRefundRepository,
      mockGetByIdRefundRepository,
      mockCloseConfirmedRefundEvent,
      mockCreateRefundDevolutionEvent,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update if missing params', async () => {
      const {
        sut,
        mockGetByIdRefundRepository,
        mockUpdateRefundRepository,
        mockCloseConfirmedRefundEvent,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetByIdRefundRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRefundRepository).toHaveBeenCalledTimes(0);
      expect(mockCloseConfirmedRefundEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not update if refund not exists', async () => {
      const {
        sut,
        mockGetByIdRefundRepository,
        mockUpdateRefundRepository,
        mockCloseConfirmedRefundEvent,
      } = makeSut();
      const { id } = await PixRefundFactory.create<PixRefundEntity>(
        PixRefundEntity.name,
      );
      mockGetByIdRefundRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(id);

      await expect(testScript).rejects.toThrow(PixRefundNotFoundException);
      expect(mockGetByIdRefundRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRefundRepository).toHaveBeenCalledTimes(0);
      expect(mockCloseConfirmedRefundEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not update if state is invalid', async () => {
      const {
        sut,
        mockGetByIdRefundRepository,
        mockUpdateRefundRepository,
        mockCloseConfirmedRefundEvent,
      } = makeSut();
      const refund = await PixRefundFactory.create<PixRefundEntity>(
        PixRefundEntity.name,
        { state: PixRefundState.CANCEL_PENDING },
      );
      mockGetByIdRefundRepository.mockResolvedValue(refund);

      const testScript = () => sut.execute(refund.id);

      await expect(testScript).rejects.toThrow(PixRefundInvalidStateException);
      expect(mockGetByIdRefundRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRefundRepository).toHaveBeenCalledTimes(0);
      expect(mockCloseConfirmedRefundEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - should create refund successfully', async () => {
      const {
        sut,
        mockGetByIdRefundRepository,
        mockUpdateRefundRepository,
        mockCloseConfirmedRefundEvent,
        mockCreateRefundDevolutionEvent,
      } = makeSut();
      const refund = await PixRefundFactory.create<PixRefundEntity>(
        PixRefundEntity.name,
        {
          state: PixRefundState.CLOSED_PENDING,
          status: PixRefundStatus.CLOSED,
        },
      );

      mockGetByIdRefundRepository.mockResolvedValue(refund);

      const result = await sut.execute(refund.id);

      expect(result).toBeDefined();
      expect(result.status).toEqual(PixRefundStatus.CLOSED);
      expect(result.state).toEqual(PixRefundState.CLOSED_WAITING);
      expect(mockGetByIdRefundRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRefundRepository).toHaveBeenCalledTimes(1);
      expect(mockCloseConfirmedRefundEvent).toHaveBeenCalledTimes(1);
      expect(mockCreateRefundDevolutionEvent).toHaveBeenCalledTimes(1);
    });
  });
});
