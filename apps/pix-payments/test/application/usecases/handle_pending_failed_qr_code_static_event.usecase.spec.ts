import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  QrCodeStaticRepository,
  QrCodeStaticEntity,
  QrCodeStaticState,
} from '@zro/pix-payments/domain';
import {
  HandlePendingFailedQrCodeStaticEventUseCase as UseCase,
  QrCodeStaticEventEmitter,
  QrCodeStaticNotFoundException,
} from '@zro/pix-payments/application';
import { QrCodeStaticFactory } from '@zro/test/pix-payments/config';

describe('HandlePendingFailedQrCodeStaticEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: QrCodeStaticEventEmitter =
      createMock<QrCodeStaticEventEmitter>();
    const mockErrorEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.errorQrCodeStatic),
    );

    return {
      eventEmitter,
      mockErrorEventEmitter,
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

    const { eventEmitter, mockErrorEventEmitter } = mockEmitter();

    const sut = new UseCase(logger, qrCodeStaticRepository, eventEmitter);
    return {
      sut,
      mockUpdateQrCodeStaticRepository,
      mockGetQrCodeStaticByIdRepository,
      mockErrorEventEmitter,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should handle failed QrCodeStatic successfully', async () => {
      const {
        sut,
        mockUpdateQrCodeStaticRepository,
        mockGetQrCodeStaticByIdRepository,
        mockErrorEventEmitter,
      } = makeSut();

      const qrCodeStatic = await QrCodeStaticFactory.create<QrCodeStaticEntity>(
        QrCodeStaticEntity.name,
        { state: QrCodeStaticState.PENDING },
      );

      mockGetQrCodeStaticByIdRepository.mockResolvedValue(qrCodeStatic);

      const result = await sut.execute(qrCodeStatic.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(qrCodeStatic.id);
      expect(result.pixKey.id).toBe(qrCodeStatic.pixKey.id);
      expect(result.state).toBe(QrCodeStaticState.ERROR);
      expect(mockGetQrCodeStaticByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateQrCodeStaticRepository).toHaveBeenCalledTimes(1);
      expect(mockErrorEventEmitter).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not handle failed if incorrect state', async () => {
      const {
        sut,
        mockUpdateQrCodeStaticRepository,
        mockGetQrCodeStaticByIdRepository,
        mockErrorEventEmitter,
      } = makeSut();

      const qrCodeStatic = await QrCodeStaticFactory.create<QrCodeStaticEntity>(
        QrCodeStaticEntity.name,
        { state: QrCodeStaticState.ERROR },
      );

      mockGetQrCodeStaticByIdRepository.mockResolvedValue(qrCodeStatic);

      const result = await sut.execute(qrCodeStatic.id);

      expect(result).toBeDefined();
      expect(result).toMatchObject(qrCodeStatic);
      expect(mockGetQrCodeStaticByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateQrCodeStaticRepository).toHaveBeenCalledTimes(0);
      expect(mockErrorEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not create if id is null', async () => {
      const {
        sut,
        mockUpdateQrCodeStaticRepository,
        mockGetQrCodeStaticByIdRepository,
        mockErrorEventEmitter,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetQrCodeStaticByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateQrCodeStaticRepository).toHaveBeenCalledTimes(0);
      expect(mockErrorEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not create if id is not found', async () => {
      const {
        sut,
        mockUpdateQrCodeStaticRepository,
        mockGetQrCodeStaticByIdRepository,
        mockErrorEventEmitter,
      } = makeSut();

      mockGetQrCodeStaticByIdRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(uuidV4());

      await expect(testScript).rejects.toThrow(QrCodeStaticNotFoundException);
      expect(mockGetQrCodeStaticByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateQrCodeStaticRepository).toHaveBeenCalledTimes(0);
      expect(mockErrorEventEmitter).toHaveBeenCalledTimes(0);
    });
  });
});
