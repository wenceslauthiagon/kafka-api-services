import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  InvalidGetRefundNotFoundPixPaymentPspException,
  OfflinePixPaymentPspException,
  PixRefundEventEmitter,
  PixRefundGateway,
  SyncPixRefundUseCase as UseCase,
} from '@zro/pix-payments/application';
import * as MockTestGetRefund from '@zro/test/pix-payments/config/mocks/get_refunds.mock';

describe('SyncPixRefundUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const { eventEmitter, mockReceiveEvent } = mockEmitter();

    const { pspGateway, mockGetGateway } = mockGateway();

    const sut = new UseCase(logger, eventEmitter, pspGateway);
    return {
      sut,
      mockReceiveEvent,
      mockGetGateway,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: PixRefundEventEmitter =
      createMock<PixRefundEventEmitter>();
    const mockReceiveEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.receivePixRefund),
    );

    return {
      eventEmitter,
      mockReceiveEvent,
    };
  };

  const mockGateway = () => {
    const pspGateway: PixRefundGateway = createMock<PixRefundGateway>();
    const mockGetGateway: jest.Mock = On(pspGateway).get(
      method((mock) => mock.getRefundRequest),
    );

    return {
      pspGateway,
      mockGetGateway,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should sync open pix refund successfully.', async () => {
      const { sut, mockReceiveEvent, mockGetGateway } = makeSut();

      mockGetGateway.mockImplementation(MockTestGetRefund.success);

      await sut.execute();

      expect(mockReceiveEvent).toHaveBeenCalledTimes(1);
      expect(mockGetGateway).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should sync open pix refund failed when not found.', async () => {
      const { sut, mockReceiveEvent, mockGetGateway } = makeSut();

      mockGetGateway.mockImplementation(MockTestGetRefund.failedNotfound);

      const testScript = () => sut.execute();

      await expect(testScript).rejects.toThrow(
        InvalidGetRefundNotFoundPixPaymentPspException,
      );
      expect(mockReceiveEvent).toHaveBeenCalledTimes(0);
      expect(mockGetGateway).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should sync open pix refund failed when psp offline.', async () => {
      const { sut, mockReceiveEvent, mockGetGateway } = makeSut();

      mockGetGateway.mockImplementation(MockTestGetRefund.offline);

      const testScript = () => sut.execute();

      await expect(testScript).rejects.toThrow(OfflinePixPaymentPspException);
      expect(mockReceiveEvent).toHaveBeenCalledTimes(0);
      expect(mockGetGateway).toHaveBeenCalledTimes(1);
    });
  });
});
