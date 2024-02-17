import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  PixFraudDetectionEntity,
  PixFraudDetectionStatus,
} from '@zro/pix-payments/domain';
import {
  SyncPixFraudDetectionUseCase as UseCase,
  PixFraudDetectionEventEmitter,
  PixFraudDetectionGateway,
} from '@zro/pix-payments/application';
import { PixFraudDetectionFactory } from '@zro/test/pix-payments/config';

describe('SyncPixFraudDetectionUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixFraudDetectionEventEmitter =
      createMock<PixFraudDetectionEventEmitter>();

    const mockRegisteredEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.receivedPixFraudDetection),
    );

    const mockCanceledEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.cancelPixFraudDetectionReceived),
    );

    return {
      eventEmitter,
      mockRegisteredEvent,
      mockCanceledEvent,
    };
  };

  const mockGateway = () => {
    const gateway: PixFraudDetectionGateway =
      createMock<PixFraudDetectionGateway>();
    const mockGetAllGateway: jest.Mock = On(gateway).get(
      method((mock) => mock.getAllFraudDetection),
    );

    return {
      gateway,
      mockGetAllGateway,
    };
  };

  const makeSut = () => {
    const { eventEmitter, mockRegisteredEvent, mockCanceledEvent } =
      mockEmitter();

    const { gateway, mockGetAllGateway } = mockGateway();

    const sut = new UseCase(logger, eventEmitter, gateway);

    return {
      sut,
      mockRegisteredEvent,
      mockCanceledEvent,
      mockGetAllGateway,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should sync and emit receivedPixFraudDetection successfully.', async () => {
      const { sut, mockRegisteredEvent, mockCanceledEvent, mockGetAllGateway } =
        makeSut();

      const fraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
          {
            status: PixFraudDetectionStatus.REGISTERED,
          },
        );

      const pspResponse = {
        fraudDetections: [
          {
            fraudDetectionId: fraudDetection.id,
            document: fraudDetection.document,
            fraudType: fraudDetection.fraudType,
            status: fraudDetection.status,
            key: fraudDetection.key,
          },
        ],
      };

      mockGetAllGateway.mockResolvedValue(pspResponse);

      await sut.execute();

      expect(mockRegisteredEvent).toHaveBeenCalledTimes(1);
      expect(mockCanceledEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should sync and emit cancelPixFraudDetectionReceived successfully.', async () => {
      const { sut, mockRegisteredEvent, mockCanceledEvent, mockGetAllGateway } =
        makeSut();

      const fraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
          {
            status: PixFraudDetectionStatus.CANCELED_REGISTERED,
          },
        );

      const pspResponse = {
        fraudDetections: [
          {
            fraudDetectionId: fraudDetection.id,
            document: fraudDetection.document,
            fraudType: fraudDetection.fraudType,
            status: fraudDetection.status,
            key: fraudDetection.key,
          },
        ],
      };

      mockGetAllGateway.mockResolvedValue(pspResponse);

      await sut.execute();

      expect(mockRegisteredEvent).toHaveBeenCalledTimes(0);
      expect(mockCanceledEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0003 - Should return if no response is found.', async () => {
      const { sut, mockRegisteredEvent, mockCanceledEvent, mockGetAllGateway } =
        makeSut();

      mockGetAllGateway.mockResolvedValue(null);

      await sut.execute();

      expect(mockRegisteredEvent).toHaveBeenCalledTimes(0);
      expect(mockCanceledEvent).toHaveBeenCalledTimes(0);
    });
  });
});
