import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  QrCodeDynamicEntity,
  QrCodeDynamicRepository,
  PixQrCodeDynamicState,
} from '@zro/pix-payments/domain';
import {
  HandlePendingFailedQrCodeDynamicEventUseCase as UseCase,
  QrCodeDynamicEventEmitter,
  QrCodeDynamicNotFoundException,
} from '@zro/pix-payments/application';
import { QrCodeDynamicFactory } from '@zro/test/pix-payments/config';

describe('HandlePendingFailedQrCodeDynamicEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: QrCodeDynamicEventEmitter =
      createMock<QrCodeDynamicEventEmitter>();
    const mockErrorEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.errorQrCodeDynamic),
    );

    return {
      eventEmitter,
      mockErrorEventEmitter,
    };
  };

  const mockRepository = () => {
    const qrCodeDynamicRepository: QrCodeDynamicRepository =
      createMock<QrCodeDynamicRepository>();
    const mockGetQrCodeDynamicByIdRepository: jest.Mock = On(
      qrCodeDynamicRepository,
    ).get(method((mock) => mock.getById));
    const mockUpdateQrCodeDynamicRepository: jest.Mock = On(
      qrCodeDynamicRepository,
    ).get(method((mock) => mock.update));

    return {
      qrCodeDynamicRepository,
      mockUpdateQrCodeDynamicRepository,
      mockGetQrCodeDynamicByIdRepository,
    };
  };

  const makeSut = () => {
    const {
      qrCodeDynamicRepository,
      mockGetQrCodeDynamicByIdRepository,
      mockUpdateQrCodeDynamicRepository,
    } = mockRepository();

    const { eventEmitter, mockErrorEventEmitter } = mockEmitter();

    const sut = new UseCase(logger, qrCodeDynamicRepository, eventEmitter);
    return {
      sut,
      mockGetQrCodeDynamicByIdRepository,
      mockUpdateQrCodeDynamicRepository,
      mockErrorEventEmitter,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should handle pending failed qr code dynamic successfully', async () => {
      const {
        sut,
        mockGetQrCodeDynamicByIdRepository,
        mockUpdateQrCodeDynamicRepository,
        mockErrorEventEmitter,
      } = makeSut();

      const qrCodeDynamic =
        await QrCodeDynamicFactory.create<QrCodeDynamicEntity>(
          QrCodeDynamicEntity.name,
          {
            state: PixQrCodeDynamicState.PENDING,
          },
        );

      mockGetQrCodeDynamicByIdRepository.mockResolvedValueOnce(qrCodeDynamic);

      const result = await sut.execute(qrCodeDynamic.id);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.state).toBeDefined();
      expect(result.emv).toBeDefined();
      expect(result.txId).toBeDefined();
      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateQrCodeDynamicRepository).toHaveBeenCalledTimes(1);
      expect(mockErrorEventEmitter).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Return qr code dynamic if state is ready ', async () => {
      const {
        sut,
        mockGetQrCodeDynamicByIdRepository,
        mockUpdateQrCodeDynamicRepository,
        mockErrorEventEmitter,
      } = makeSut();

      const qrCodeDynamic =
        await QrCodeDynamicFactory.create<QrCodeDynamicEntity>(
          QrCodeDynamicEntity.name,
          {
            state: PixQrCodeDynamicState.READY,
          },
        );

      mockGetQrCodeDynamicByIdRepository.mockResolvedValueOnce(qrCodeDynamic);

      const result = await sut.execute(qrCodeDynamic.id);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.state).toBeDefined();
      expect(result.emv).toBeDefined();
      expect(result.txId).toBeDefined();
      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateQrCodeDynamicRepository).toHaveBeenCalledTimes(0);
      expect(mockErrorEventEmitter).toHaveBeenCalledTimes(0);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0003 - Should not handle created if qr code dynamic not found', async () => {
      const {
        sut,
        mockGetQrCodeDynamicByIdRepository,
        mockUpdateQrCodeDynamicRepository,
        mockErrorEventEmitter,
      } = makeSut();

      const qrCodeDynamic =
        await QrCodeDynamicFactory.create<QrCodeDynamicEntity>(
          QrCodeDynamicEntity.name,
          {
            state: PixQrCodeDynamicState.ERROR,
          },
        );

      mockGetQrCodeDynamicByIdRepository.mockResolvedValueOnce(null);

      const testScript = () => sut.execute(qrCodeDynamic.id);

      await expect(testScript).rejects.toThrow(QrCodeDynamicNotFoundException);
      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateQrCodeDynamicRepository).toHaveBeenCalledTimes(0);
      expect(mockErrorEventEmitter).toHaveBeenCalledTimes(0);
    });
  });
});
