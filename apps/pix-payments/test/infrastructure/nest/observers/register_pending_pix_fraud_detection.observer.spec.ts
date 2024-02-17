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
import {
  IssuePixFraudDetectionGateway,
  PixFraudDetectionGateway,
} from '@zro/pix-payments/application';
import {
  RegisterPendingPixFraudDetectionNestObserver as Observer,
  PixFraudDetectionDatabaseRepository,
  PixFraudDetectionModel,
} from '@zro/pix-payments/infrastructure';
import {
  HandleRegisterPendingPixFraudDetectionEventRequest,
  PixFraudDetectionEventEmitterControllerInterface,
  PixFraudDetectionEventType,
} from '@zro/pix-payments/interface';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PixFraudDetectionFactory } from '@zro/test/pix-payments/config';
import { KafkaContext } from '@nestjs/microservices';

describe('RegisterPendingPixFraudDetectionNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let pixFraudDetectionRepository: PixFraudDetectionRepository;

  const pixFraudDetectionGateway: PixFraudDetectionGateway =
    createMock<PixFraudDetectionGateway>();
  const mockCreatePsp: jest.Mock = On(pixFraudDetectionGateway).get(
    method((mock) => mock.createFraudDetection),
  );

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
            state: PixFraudDetectionState.REGISTERED_PENDING,
          },
        );

      mockCreatePsp.mockResolvedValueOnce({
        fraudDetectionId: uuidV4(),
        status: PixFraudDetectionStatus.REGISTERED,
      });

      const message: HandleRegisterPendingPixFraudDetectionEventRequest = {
        id: pixFraudDetection.id,
      };

      await controller.execute(
        message,
        pixFraudDetectionGateway,
        pixFraudDetectionIssueGateway,
        pixFraudDetectionRepository,
        pixFraudDetectionEventEmitter,
        logger,
        ctx,
      );

      expect(mockCreatePsp).toHaveBeenCalledTimes(1);
      expect(mockUpdateIssue).toHaveBeenCalledTimes(1);
      expect(mockEmitEvent).toHaveBeenCalledTimes(1);
      expect(mockEmitEvent.mock.calls[0][0]).toBe(
        PixFraudDetectionEventType.REGISTERED_CONFIRMED,
      );
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should throw InvalidDataFormatException when missing params', async () => {
      const message: HandleRegisterPendingPixFraudDetectionEventRequest = {
        id: null,
      };

      const testScript = () =>
        controller.execute(
          message,
          pixFraudDetectionGateway,
          pixFraudDetectionIssueGateway,
          pixFraudDetectionRepository,
          pixFraudDetectionEventEmitter,
          logger,
          ctx,
        );

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      expect(mockCreatePsp).toHaveBeenCalledTimes(0);
      expect(mockUpdateIssue).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
