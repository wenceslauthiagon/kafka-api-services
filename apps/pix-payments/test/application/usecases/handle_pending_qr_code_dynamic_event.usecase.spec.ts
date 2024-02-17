import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  QrCodeDynamicEntity,
  QrCodeDynamicRepository,
  PixQrCodeDynamicState,
} from '@zro/pix-payments/domain';
import {
  HandlePendingQrCodeDynamicEventUseCase as UseCase,
  PixPaymentGateway,
  QrCodeDynamicEventEmitter,
  QrCodeDynamicNotFoundException,
} from '@zro/pix-payments/application';
import { QrCodeDynamicFactory } from '@zro/test/pix-payments/config';

describe('HandlePendingQrCodeDynamicEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: QrCodeDynamicEventEmitter =
      createMock<QrCodeDynamicEventEmitter>();
    const mockReadyEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.readyQrCodeDynamic),
    );

    return {
      eventEmitter,
      mockReadyEventEmitter,
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

  const mockGateway = () => {
    const pspGateway: PixPaymentGateway = createMock<PixPaymentGateway>();
    const mockCreateQrCodeDynamicGateway: jest.Mock = On(pspGateway).get(
      method((mock) => mock.createQrCodeDynamic),
    );
    const mockCreateQrCodeDynamicDueDateGateway: jest.Mock = On(pspGateway).get(
      method((mock) => mock.createQrCodeDynamicDueDate),
    );

    return {
      pspGateway,
      mockCreateQrCodeDynamicGateway,
      mockCreateQrCodeDynamicDueDateGateway,
    };
  };

  const makeSut = () => {
    const {
      qrCodeDynamicRepository,
      mockGetQrCodeDynamicByIdRepository,
      mockUpdateQrCodeDynamicRepository,
    } = mockRepository();

    const { eventEmitter, mockReadyEventEmitter } = mockEmitter();

    const {
      pspGateway,
      mockCreateQrCodeDynamicGateway,
      mockCreateQrCodeDynamicDueDateGateway,
    } = mockGateway();

    const sut = new UseCase(
      logger,
      qrCodeDynamicRepository,
      pspGateway,
      eventEmitter,
    );
    return {
      sut,
      mockGetQrCodeDynamicByIdRepository,
      mockUpdateQrCodeDynamicRepository,
      mockReadyEventEmitter,
      mockCreateQrCodeDynamicGateway,
      mockCreateQrCodeDynamicDueDateGateway,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should handle create qr code dynamic successfully', async () => {
      const {
        sut,
        mockGetQrCodeDynamicByIdRepository,
        mockUpdateQrCodeDynamicRepository,
        mockCreateQrCodeDynamicGateway,
        mockCreateQrCodeDynamicDueDateGateway,
        mockReadyEventEmitter,
      } = makeSut();

      const qrCodeDynamic =
        await QrCodeDynamicFactory.create<QrCodeDynamicEntity>(
          QrCodeDynamicEntity.name,
          { state: PixQrCodeDynamicState.PENDING, dueDate: null },
        );

      mockGetQrCodeDynamicByIdRepository.mockResolvedValueOnce(qrCodeDynamic);

      const result = await sut.execute(qrCodeDynamic.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(qrCodeDynamic.id);
      expect(result.state).toBe(PixQrCodeDynamicState.READY);
      expect(result.emv).toBeDefined();
      expect(result.txId).toBe(qrCodeDynamic.txId);
      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateQrCodeDynamicRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateQrCodeDynamicGateway).toHaveBeenCalledTimes(1);
      expect(mockCreateQrCodeDynamicDueDateGateway).toHaveBeenCalledTimes(0);
      expect(mockReadyEventEmitter).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should handle create qr code dynamic (Due Date) successfully', async () => {
      const {
        sut,
        mockGetQrCodeDynamicByIdRepository,
        mockUpdateQrCodeDynamicRepository,
        mockCreateQrCodeDynamicGateway,
        mockCreateQrCodeDynamicDueDateGateway,
        mockReadyEventEmitter,
      } = makeSut();

      const qrCodeDynamic =
        await QrCodeDynamicFactory.create<QrCodeDynamicEntity>(
          QrCodeDynamicEntity.name,
          { state: PixQrCodeDynamicState.PENDING },
        );

      mockGetQrCodeDynamicByIdRepository.mockResolvedValueOnce(qrCodeDynamic);

      const result = await sut.execute(qrCodeDynamic.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(qrCodeDynamic.id);
      expect(result.state).toBe(PixQrCodeDynamicState.READY);
      expect(result.emv).toBeDefined();
      expect(result.txId).toBe(qrCodeDynamic.txId);
      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateQrCodeDynamicRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateQrCodeDynamicGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeDynamicDueDateGateway).toHaveBeenCalledTimes(1);
      expect(mockReadyEventEmitter).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0003 - Should not handle create if qr code dynamic not found', async () => {
      const {
        sut,
        mockGetQrCodeDynamicByIdRepository,
        mockUpdateQrCodeDynamicRepository,
        mockCreateQrCodeDynamicGateway,
        mockCreateQrCodeDynamicDueDateGateway,
        mockReadyEventEmitter,
      } = makeSut();

      const qrCodeDynamic =
        await QrCodeDynamicFactory.create<QrCodeDynamicEntity>(
          QrCodeDynamicEntity.name,
          { state: PixQrCodeDynamicState.ERROR },
        );

      mockGetQrCodeDynamicByIdRepository.mockResolvedValueOnce(null);

      const testScript = () => sut.execute(qrCodeDynamic.id);

      await expect(testScript).rejects.toThrow(QrCodeDynamicNotFoundException);

      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateQrCodeDynamicRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeDynamicGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeDynamicDueDateGateway).toHaveBeenCalledTimes(0);
      expect(mockReadyEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not handle create qr code dynamic (Due Date) if not found', async () => {
      const {
        sut,
        mockGetQrCodeDynamicByIdRepository,
        mockUpdateQrCodeDynamicRepository,
        mockCreateQrCodeDynamicGateway,
        mockCreateQrCodeDynamicDueDateGateway,
        mockReadyEventEmitter,
      } = makeSut();

      const qrCodeDynamic =
        await QrCodeDynamicFactory.create<QrCodeDynamicEntity>(
          QrCodeDynamicEntity.name,
          { state: PixQrCodeDynamicState.ERROR },
        );

      mockGetQrCodeDynamicByIdRepository.mockResolvedValueOnce(null);

      const testScript = () => sut.execute(qrCodeDynamic.id);

      await expect(testScript).rejects.toThrow(QrCodeDynamicNotFoundException);

      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateQrCodeDynamicRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeDynamicGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeDynamicDueDateGateway).toHaveBeenCalledTimes(0);
      expect(mockReadyEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not handle create if incorrect state', async () => {
      const {
        sut,
        mockGetQrCodeDynamicByIdRepository,
        mockUpdateQrCodeDynamicRepository,
        mockCreateQrCodeDynamicGateway,
        mockCreateQrCodeDynamicDueDateGateway,
        mockReadyEventEmitter,
      } = makeSut();

      const qrCodeDynamic =
        await QrCodeDynamicFactory.create<QrCodeDynamicEntity>(
          QrCodeDynamicEntity.name,
          { state: PixQrCodeDynamicState.READY, dueDate: null },
        );

      mockGetQrCodeDynamicByIdRepository.mockResolvedValueOnce(qrCodeDynamic);

      const result = await sut.execute(qrCodeDynamic.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(qrCodeDynamic.id);
      expect(result.state).toBe(qrCodeDynamic.state);
      expect(result.emv).toBe(qrCodeDynamic.emv);
      expect(result.txId).toBe(qrCodeDynamic.txId);
      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateQrCodeDynamicRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeDynamicGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeDynamicDueDateGateway).toHaveBeenCalledTimes(0);
      expect(mockReadyEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not handle create qr code dynamic (Due Date) if incorrect state', async () => {
      const {
        sut,
        mockGetQrCodeDynamicByIdRepository,
        mockUpdateQrCodeDynamicRepository,
        mockCreateQrCodeDynamicDueDateGateway,
        mockReadyEventEmitter,
      } = makeSut();

      const qrCodeDynamic =
        await QrCodeDynamicFactory.create<QrCodeDynamicEntity>(
          QrCodeDynamicEntity.name,
          { state: PixQrCodeDynamicState.READY },
        );

      mockGetQrCodeDynamicByIdRepository.mockResolvedValueOnce(qrCodeDynamic);

      const result = await sut.execute(qrCodeDynamic.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(qrCodeDynamic.id);
      expect(result.state).toBe(qrCodeDynamic.state);
      expect(result.emv).toBe(qrCodeDynamic.emv);
      expect(result.txId).toBe(qrCodeDynamic.txId);
      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateQrCodeDynamicRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeDynamicDueDateGateway).toHaveBeenCalledTimes(0);
      expect(mockReadyEventEmitter).toHaveBeenCalledTimes(0);
    });
  });
});
