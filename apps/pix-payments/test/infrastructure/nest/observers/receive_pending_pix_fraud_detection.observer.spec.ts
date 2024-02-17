import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import {
  PixFraudDetectionRepository,
  PixFraudDetectionState,
  PixFraudDetectionStatus,
} from '@zro/pix-payments/domain';
import { IssuePixFraudDetectionGateway } from '@zro/pix-payments/application';
import {
  ReceivePendingPixFraudDetectionNestObserver as Observer,
  PixFraudDetectionDatabaseRepository,
  PixFraudDetectionModel,
} from '@zro/pix-payments/infrastructure';
import {
  HandleReceivePendingPixFraudDetectionEventRequest,
  PixFraudDetectionEventEmitterControllerInterface,
  PixFraudDetectionEventType,
} from '@zro/pix-payments/interface';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PixFraudDetectionFactory } from '@zro/test/pix-payments/config';
import { KafkaContext } from '@nestjs/microservices';

describe('ReceivePendingPixFraudDetectionNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let pixFraudDetectionRepository: PixFraudDetectionRepository;

  const pixFraudDetectionIssueGateway: IssuePixFraudDetectionGateway =
    createMock<IssuePixFraudDetectionGateway>();
  const mockCreateIssue: jest.Mock = On(pixFraudDetectionIssueGateway).get(
    method((mock) => mock.createPixFraudDetectionIssue),
  );

  const pixFraudDetectionEventEmitter: PixFraudDetectionEventEmitterControllerInterface =
    createMock<PixFraudDetectionEventEmitterControllerInterface>();
  const mockEmitEvent: jest.Mock = On(pixFraudDetectionEventEmitter).get(
    method((mock) => mock.emitPixFraudDetectionEvent),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();

    controller = module.get<Observer>(Observer);
    pixFraudDetectionRepository = new PixFraudDetectionDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should execute PixFraudDetectionEntity successfully.', async () => {
      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionModel>(
          PixFraudDetectionModel.name,
          {
            state: PixFraudDetectionState.RECEIVED_PENDING,
          },
        );

      mockCreateIssue.mockResolvedValueOnce({
        fraudDetectionId: uuidV4(),
        status: PixFraudDetectionStatus.REGISTERED,
      });

      const message: HandleReceivePendingPixFraudDetectionEventRequest = {
        id: pixFraudDetection.id,
        externalId: pixFraudDetection.externalId,
        document: pixFraudDetection.document,
        fraudType: pixFraudDetection.fraudType,
        status: pixFraudDetection.status,
        key: pixFraudDetection.key,
        state: pixFraudDetection.state,
      };

      await controller.execute(
        message,
        pixFraudDetectionIssueGateway,
        pixFraudDetectionRepository,
        pixFraudDetectionEventEmitter,
        logger,
        ctx,
      );

      expect(mockCreateIssue).toHaveBeenCalledTimes(1);
      expect(mockEmitEvent).toHaveBeenCalledTimes(1);
      expect(mockEmitEvent.mock.calls[0][0]).toBe(
        PixFraudDetectionEventType.RECEIVED_CONFIRMED,
      );
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should throw InvalidDataFormatException when missing params', async () => {
      const message: HandleReceivePendingPixFraudDetectionEventRequest = {
        id: null,
        externalId: null,
        document: null,
        fraudType: null,
        status: null,
        key: null,
        state: null,
      };

      const testScript = () =>
        controller.execute(
          message,
          pixFraudDetectionIssueGateway,
          pixFraudDetectionRepository,
          pixFraudDetectionEventEmitter,
          logger,
          ctx,
        );

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      expect(mockCreateIssue).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
