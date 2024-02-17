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
} from '@zro/pix-payments/domain';
import { IssuePixFraudDetectionGateway } from '@zro/pix-payments/application';
import {
  CancelPendingPixFraudDetectionReceivedNestObserver as Observer,
  PixFraudDetectionDatabaseRepository,
  PixFraudDetectionModel,
} from '@zro/pix-payments/infrastructure';
import {
  HandleCancelPendingPixFraudDetectionReceivedEventRequest,
  PixFraudDetectionEventEmitterControllerInterface,
  PixFraudDetectionEventType,
} from '@zro/pix-payments/interface';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PixFraudDetectionFactory } from '@zro/test/pix-payments/config';
import { KafkaContext } from '@nestjs/microservices';

describe('CancelPendingPixFraudDetectionReceivedNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let pixFraudDetectionRepository: PixFraudDetectionRepository;

  const pixFraudDetectionIssueGateway: IssuePixFraudDetectionGateway =
    createMock<IssuePixFraudDetectionGateway>();
  const mockUpdateIssue: jest.Mock = On(pixFraudDetectionIssueGateway).get(
    method((mock) => mock.updatePixFraudDetectionIssue),
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
            state: PixFraudDetectionState.CANCELED_RECEIVED_PENDING,
          },
        );

      const message: HandleCancelPendingPixFraudDetectionReceivedEventRequest =
        {
          id: pixFraudDetection.id,
          externalId: pixFraudDetection.externalId,
          document: pixFraudDetection.document,
          fraudType: pixFraudDetection.fraudType,
          status: pixFraudDetection.status,
          key: pixFraudDetection.key,
        };

      await controller.execute(
        message,
        pixFraudDetectionIssueGateway,
        pixFraudDetectionRepository,
        pixFraudDetectionEventEmitter,
        logger,
        ctx,
      );

      expect(mockUpdateIssue).toHaveBeenCalledTimes(1);
      expect(mockEmitEvent).toHaveBeenCalledTimes(1);
      expect(mockEmitEvent.mock.calls[0][0]).toBe(
        PixFraudDetectionEventType.CANCELED_RECEIVED_CONFIRMED,
      );
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should throw InvalidDataFormatException when missing params', async () => {
      const message: HandleCancelPendingPixFraudDetectionReceivedEventRequest =
        {
          id: null,
          externalId: null,
          document: null,
          fraudType: null,
          status: null,
          key: null,
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
      expect(mockUpdateIssue).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
