import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  QrCodeStaticEntity,
  QrCodeStaticRepository,
  QrCodeStaticState,
} from '@zro/pix-payments/domain';
import {
  HandlePendingQrCodeStaticEventUseCase as UseCase,
  PixPaymentGateway,
  QrCodeStaticEventEmitter,
} from '@zro/pix-payments/application';
import { QrCodeStaticFactory } from '@zro/test/pix-payments/config';
import * as createQrCodeStaticPspGatewayMock from '@zro/test/pix-payments/config/mocks/create_qr_code_static.mock';

describe('HandlePendingQrCodeStaticEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockGateway = () => {
    const pspGateway: PixPaymentGateway = createMock<PixPaymentGateway>();
    const mockCreateGateway: jest.Mock = On(pspGateway).get(
      method((mock) => mock.createQrCodeStatic),
    );
    return {
      pspGateway,
      mockCreateGateway,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: QrCodeStaticEventEmitter =
      createMock<QrCodeStaticEventEmitter>();
    const mockReadyEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.readyQrCodeStatic),
    );

    return {
      eventEmitter,
      mockReadyEventEmitter,
    };
  };

  const mockRepository = () => {
    const qrCodeStaticRepository: QrCodeStaticRepository =
      createMock<QrCodeStaticRepository>();
    const mockUpdateQrCodeStaticRepository: jest.Mock = On(
      qrCodeStaticRepository,
    ).get(method((mock) => mock.update));
    const mockGetQrCodeStaticByIdRepository: jest.Mock = On(
      qrCodeStaticRepository,
    ).get(method((mock) => mock.getById));

    return {
      qrCodeStaticRepository,
      mockUpdateQrCodeStaticRepository,
      mockGetQrCodeStaticByIdRepository,
    };
  };

  const makeSut = () => {
    const {
      qrCodeStaticRepository,
      mockUpdateQrCodeStaticRepository,
      mockGetQrCodeStaticByIdRepository,
    } = mockRepository();

    const { eventEmitter, mockReadyEventEmitter } = mockEmitter();
    const { pspGateway, mockCreateGateway } = mockGateway();

    const sut = new UseCase(
      logger,
      qrCodeStaticRepository,
      pspGateway,
      eventEmitter,
    );
    return {
      sut,
      mockUpdateQrCodeStaticRepository,
      mockGetQrCodeStaticByIdRepository,
      mockReadyEventEmitter,
      mockCreateGateway,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should handle created QrCodeStatic successfully', async () => {
      const {
        sut,
        mockUpdateQrCodeStaticRepository,
        mockGetQrCodeStaticByIdRepository,
        mockReadyEventEmitter,
        mockCreateGateway,
      } = makeSut();

      const qrCodeStatic = await QrCodeStaticFactory.create<QrCodeStaticEntity>(
        QrCodeStaticEntity.name,
        { state: QrCodeStaticState.PENDING },
      );

      mockGetQrCodeStaticByIdRepository.mockResolvedValue(qrCodeStatic);
      mockCreateGateway.mockImplementationOnce(
        createQrCodeStaticPspGatewayMock.success,
      );

      const result = await sut.execute(qrCodeStatic.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(qrCodeStatic.id);
      expect(result.pixKey.id).toBe(qrCodeStatic.pixKey.id);
      expect(result.state).toBe(QrCodeStaticState.READY);
      expect(result.emv).toBeDefined();
      expect(result.txId).toBe(qrCodeStatic.txId);
      expect(mockUpdateQrCodeStaticRepository).toHaveBeenCalledTimes(1);
      expect(mockGetQrCodeStaticByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateGateway).toHaveBeenCalledTimes(1);
      expect(mockReadyEventEmitter).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not handle created if incorrect state', async () => {
      const {
        sut,
        mockUpdateQrCodeStaticRepository,
        mockGetQrCodeStaticByIdRepository,
        mockReadyEventEmitter,
        mockCreateGateway,
      } = makeSut();

      const qrCodeStatic = await QrCodeStaticFactory.create<QrCodeStaticEntity>(
        QrCodeStaticEntity.name,
        { state: QrCodeStaticState.READY },
      );

      mockGetQrCodeStaticByIdRepository.mockResolvedValue(qrCodeStatic);

      const result = await sut.execute(qrCodeStatic.id);

      expect(result).toBeDefined();
      expect(result).toMatchObject(qrCodeStatic);
      expect(mockUpdateQrCodeStaticRepository).toHaveBeenCalledTimes(0);
      expect(mockGetQrCodeStaticByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateGateway).toHaveBeenCalledTimes(0);
      expect(mockReadyEventEmitter).toHaveBeenCalledTimes(0);
    });
  });
});
