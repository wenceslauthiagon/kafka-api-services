import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  QrCodeStaticEntity,
  QrCodeStaticRepository,
  QrCodeStaticState,
} from '@zro/pix-payments/domain';
import {
  HandleDeletingQrCodeStaticEventUseCase as UseCase,
  PixPaymentGateway,
  QrCodeStaticEventEmitter,
} from '@zro/pix-payments/application';
import { QrCodeStaticFactory } from '@zro/test/pix-payments/config';
import * as deleteQrCodeStaticPspGatewayMock from '@zro/test/pix-payments/config/mocks/delete_qr_code_static.mock';

describe('HandleDeletingQrCodeStaticEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockRepository = () => {
    const qrCodeStaticRepository: QrCodeStaticRepository =
      createMock<QrCodeStaticRepository>();
    const mockUpdateQrCodeStaticRepository: jest.Mock = On(
      qrCodeStaticRepository,
    ).get(method((mock) => mock.update));
    const mockDeleteQrCodeStaticRepository: jest.Mock = On(
      qrCodeStaticRepository,
    ).get(method((mock) => mock.deleteById));
    const mockGetByIdQrCodeStaticRepository: jest.Mock = On(
      qrCodeStaticRepository,
    ).get(method((mock) => mock.getById));

    return {
      qrCodeStaticRepository,
      mockUpdateQrCodeStaticRepository,
      mockDeleteQrCodeStaticRepository,
      mockGetByIdQrCodeStaticRepository,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: QrCodeStaticEventEmitter =
      createMock<QrCodeStaticEventEmitter>();
    const mockDeletedEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.deletedQrCodeStatic),
    );

    return {
      eventEmitter,
      mockDeletedEventEmitter,
    };
  };

  const makeSut = () => {
    const {
      qrCodeStaticRepository,
      mockUpdateQrCodeStaticRepository,
      mockDeleteQrCodeStaticRepository,
      mockGetByIdQrCodeStaticRepository,
    } = mockRepository();

    const { eventEmitter, mockDeletedEventEmitter } = mockEmitter();

    const pspGateway: PixPaymentGateway = createMock<PixPaymentGateway>();
    const mockDeleteGateway: jest.Mock = On(pspGateway).get(
      method((mock) => mock.deleteQrCodeStatic),
    );

    const sut = new UseCase(
      logger,
      qrCodeStaticRepository,
      pspGateway,
      eventEmitter,
    );

    return {
      sut,
      mockUpdateQrCodeStaticRepository,
      mockDeleteQrCodeStaticRepository,
      mockGetByIdQrCodeStaticRepository,
      mockDeletedEventEmitter,
      mockDeleteGateway,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should handle delete QrCodeStatic successfully', async () => {
      const {
        sut,
        mockUpdateQrCodeStaticRepository,
        mockDeleteQrCodeStaticRepository,
        mockGetByIdQrCodeStaticRepository,
        mockDeletedEventEmitter,
        mockDeleteGateway,
      } = makeSut();

      const qrCodeStatic = await QrCodeStaticFactory.create<QrCodeStaticEntity>(
        QrCodeStaticEntity.name,
        { state: QrCodeStaticState.DELETING },
      );
      mockGetByIdQrCodeStaticRepository.mockResolvedValue(qrCodeStatic);
      mockDeleteGateway.mockImplementationOnce(
        deleteQrCodeStaticPspGatewayMock.success,
      );

      const result = await sut.execute(qrCodeStatic.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(qrCodeStatic.id);
      expect(result.pixKey.id).toBe(qrCodeStatic.pixKey.id);
      expect(result.state).toBe(QrCodeStaticState.DELETED);
      expect(mockGetByIdQrCodeStaticRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateQrCodeStaticRepository).toHaveBeenCalledTimes(1);
      expect(mockDeleteQrCodeStaticRepository).toHaveBeenCalledTimes(1);
      expect(mockDeleteGateway).toHaveBeenCalledTimes(1);
      expect(mockDeletedEventEmitter).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not handle delete if incorrect state', async () => {
      const {
        sut,
        mockUpdateQrCodeStaticRepository,
        mockDeleteQrCodeStaticRepository,
        mockGetByIdQrCodeStaticRepository,
        mockDeletedEventEmitter,
        mockDeleteGateway,
      } = makeSut();

      const qrCodeStatic = await QrCodeStaticFactory.create<QrCodeStaticEntity>(
        QrCodeStaticEntity.name,
        { state: QrCodeStaticState.READY },
      );

      mockGetByIdQrCodeStaticRepository.mockResolvedValue(qrCodeStatic);

      const result = await sut.execute(qrCodeStatic.id);

      expect(result).toBeDefined();
      expect(result).toMatchObject(qrCodeStatic);
      expect(mockGetByIdQrCodeStaticRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateQrCodeStaticRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteQrCodeStaticRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteGateway).toHaveBeenCalledTimes(0);
      expect(mockDeletedEventEmitter).toHaveBeenCalledTimes(0);
    });
  });
});
