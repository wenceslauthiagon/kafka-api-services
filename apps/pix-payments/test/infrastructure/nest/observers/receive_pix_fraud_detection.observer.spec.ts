import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import {
  PixFraudDetectionEntity,
  PixFraudDetectionRepository,
  PixFraudDetectionStatus,
} from '@zro/pix-payments/domain';
import {
  ReceivePixFraudDetectionNestObserver as Observer,
  PixFraudDetectionDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  HandleReceivePixFraudDetectionEventRequest,
  PixFraudDetectionEventEmitterControllerInterface,
  PixFraudDetectionEventType,
} from '@zro/pix-payments/interface';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PixFraudDetectionFactory } from '@zro/test/pix-payments/config';

describe('ReceivePixFraudDetectionNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let pixFraudDetectionRepository: PixFraudDetectionRepository;

  const pixFraudDetectionEventEmitter: PixFraudDetectionEventEmitterControllerInterface =
    createMock<PixFraudDetectionEventEmitterControllerInterface>();
  const mockEmitEvent: jest.Mock = On(pixFraudDetectionEventEmitter).get(
    method((mock) => mock.emitPixFraudDetectionEvent),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();

    controller = module.get<Observer>(Observer);
    pixFraudDetectionRepository = new PixFraudDetectionDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should execute PixFraudDetectionEntity successfully.', async () => {
      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
          {
            status: PixFraudDetectionStatus.REGISTERED,
          },
        );

      const message: HandleReceivePixFraudDetectionEventRequest = {
        externalId: pixFraudDetection.externalId,
        document: pixFraudDetection.document,
        fraudType: pixFraudDetection.fraudType,
        status: pixFraudDetection.status,
        key: pixFraudDetection.key,
      };

      await controller.execute(
        pixFraudDetectionRepository,
        pixFraudDetectionEventEmitter,
        logger,
        message,
      );

      expect(mockEmitEvent).toHaveBeenCalledTimes(1);
      expect(mockEmitEvent.mock.calls[0][0]).toBe(
        PixFraudDetectionEventType.RECEIVED_PENDING,
      );
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should throw InvalidDataFormatException when missing params', async () => {
      const message: HandleReceivePixFraudDetectionEventRequest = {
        externalId: null,
        document: null,
        fraudType: null,
        status: null,
        key: null,
      };

      const testScript = () =>
        controller.execute(
          pixFraudDetectionRepository,
          pixFraudDetectionEventEmitter,
          logger,
          message,
        );

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
