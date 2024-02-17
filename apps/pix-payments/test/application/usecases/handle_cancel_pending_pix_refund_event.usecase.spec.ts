import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixRefundEntity,
  PixRefundRepository,
  PixRefundState,
  PixRefundStatus,
} from '@zro/pix-payments/domain';
import {
  HandleCancelPendingPixRefundEventUseCase as UseCase,
  PixRefundEventEmitter,
  PixRefundGateway,
  PixRefundInvalidStateException,
  PixRefundNotFoundException,
} from '@zro/pix-payments/application';
import { PixRefundFactory } from '@zro/test/pix-payments/config';

describe('HandleCancelPendingRefundEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixRefundEventEmitter =
      createMock<PixRefundEventEmitter>();

    const mockCancelConfirmedRefundEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.cancelConfirmedPixRefund),
    );

    return {
      eventEmitter,
      mockCancelConfirmedRefundEvent,
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

    return {
      refundRepository,
      mockUpdateRefundRepository,
      mockGetByIdRefundRepository,
    };
  };

  const mockGateway = () => {
    const pixRefundGateway: PixRefundGateway = createMock<PixRefundGateway>();
    const mockCancelPixRefundGateway: jest.Mock = On(pixRefundGateway).get(
      method((mock) => mock.cancelRefundRequest),
    );

    return {
      pixRefundGateway,
      mockCancelPixRefundGateway,
    };
  };

  const makeSut = () => {
    const {
      refundRepository,
      mockUpdateRefundRepository,
      mockGetByIdRefundRepository,
    } = mockRepository();

    const { pixRefundGateway, mockCancelPixRefundGateway } = mockGateway();

    const { eventEmitter, mockCancelConfirmedRefundEvent } = mockEmitter();

    const sut = new UseCase(
      logger,
      refundRepository,
      pixRefundGateway,
      eventEmitter,
    );
    return {
      sut,
      refundRepository,
      mockUpdateRefundRepository,
      mockGetByIdRefundRepository,
      mockCancelConfirmedRefundEvent,
      mockCancelPixRefundGateway,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update if missing params', async () => {
      const {
        sut,
        mockGetByIdRefundRepository,
        mockUpdateRefundRepository,
        mockCancelConfirmedRefundEvent,
        mockCancelPixRefundGateway,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetByIdRefundRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRefundRepository).toHaveBeenCalledTimes(0);
      expect(mockCancelConfirmedRefundEvent).toHaveBeenCalledTimes(0);
      expect(mockCancelPixRefundGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not update if refund not exists', async () => {
      const {
        sut,
        mockGetByIdRefundRepository,
        mockUpdateRefundRepository,
        mockCancelConfirmedRefundEvent,
        mockCancelPixRefundGateway,
      } = makeSut();
      const { id } = await PixRefundFactory.create<PixRefundEntity>(
        PixRefundEntity.name,
      );
      mockGetByIdRefundRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(id);

      await expect(testScript).rejects.toThrow(PixRefundNotFoundException);
      expect(mockGetByIdRefundRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRefundRepository).toHaveBeenCalledTimes(0);
      expect(mockCancelConfirmedRefundEvent).toHaveBeenCalledTimes(0);
      expect(mockCancelPixRefundGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not update if state is invalid', async () => {
      const {
        sut,
        mockGetByIdRefundRepository,
        mockUpdateRefundRepository,
        mockCancelConfirmedRefundEvent,
        mockCancelPixRefundGateway,
      } = makeSut();
      const refund = await PixRefundFactory.create<PixRefundEntity>(
        PixRefundEntity.name,
        { state: PixRefundState.CLOSED_PENDING },
      );
      mockGetByIdRefundRepository.mockResolvedValue(refund);

      const testScript = () => sut.execute(refund.id);

      await expect(testScript).rejects.toThrow(PixRefundInvalidStateException);
      expect(mockGetByIdRefundRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRefundRepository).toHaveBeenCalledTimes(0);
      expect(mockCancelConfirmedRefundEvent).toHaveBeenCalledTimes(0);
      expect(mockCancelPixRefundGateway).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - should create refund successfully', async () => {
      const {
        sut,
        mockGetByIdRefundRepository,
        mockUpdateRefundRepository,
        mockCancelConfirmedRefundEvent,
        mockCancelPixRefundGateway,
      } = makeSut();
      const refund = await PixRefundFactory.create<PixRefundEntity>(
        PixRefundEntity.name,
        {
          state: PixRefundState.CANCEL_PENDING,
          status: PixRefundStatus.CANCELLED,
        },
      );

      mockGetByIdRefundRepository.mockResolvedValue(refund);

      const result = await sut.execute(refund.id);

      expect(result).toBeDefined();
      expect(result.status).toEqual(PixRefundStatus.CANCELLED);
      expect(result.state).toEqual(PixRefundState.CANCEL_CONFIRMED);
      expect(mockGetByIdRefundRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRefundRepository).toHaveBeenCalledTimes(1);
      expect(mockCancelConfirmedRefundEvent).toHaveBeenCalledTimes(1);
      expect(mockCancelPixRefundGateway).toHaveBeenCalledTimes(1);
    });
  });
});
