import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import {
  PixFraudDetectionRepository,
  PixFraudDetectionState,
  PixFraudDetectionStatus,
} from '@zro/pix-payments/domain';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  CancelPixFraudDetectionRegisteredMicroserviceController as Controller,
  PixFraudDetectionDatabaseRepository,
  PixFraudDetectionModel,
} from '@zro/pix-payments/infrastructure';
import {
  CancelPixFraudDetectionRegisteredRequest,
  PixFraudDetectionEventEmitterControllerInterface,
  PixFraudDetectionEventType,
} from '@zro/pix-payments/interface';
import { PixFraudDetectionFactory } from '@zro/test/pix-payments/config';
import { faker } from '@faker-js/faker/locale/pt_BR';

describe('CancelPixFraudDetectionRegisteredMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let repository: PixFraudDetectionRepository;

  const eventEmitter: PixFraudDetectionEventEmitterControllerInterface =
    createMock<PixFraudDetectionEventEmitterControllerInterface>();
  const mockEmitEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitPixFraudDetectionEvent),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    repository = new PixFraudDetectionDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should execute pixFraudDetection successfully', async () => {
      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionModel>(
          PixFraudDetectionModel.name,
          {
            state: PixFraudDetectionState.REGISTERED_CONFIRMED,
            status: PixFraudDetectionStatus.REGISTERED,
            issueId: faker.datatype.number({ min: 1, max: 999 }),
          },
        );

      const message: CancelPixFraudDetectionRegisteredRequest = {
        issueId: pixFraudDetection.issueId,
      };

      const result = await controller.execute(
        repository,
        eventEmitter,
        logger,
        message,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();
      expect(result.value).toBeDefined();
      expect(result.value.id).toBe(pixFraudDetection.id);
      expect(result.value.state).toBe(
        PixFraudDetectionState.CANCELED_REGISTERED_PENDING,
      );
      expect(mockEmitEvent).toHaveBeenCalledTimes(1);
      expect(mockEmitEvent.mock.calls[0][0]).toBe(
        PixFraudDetectionEventType.CANCELED_REGISTERED_PENDING,
      );
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should throw InvalidDataFormatException when missing params', async () => {
      const message: CancelPixFraudDetectionRegisteredRequest = {
        issueId: null,
      };

      const testScript = () =>
        controller.execute(repository, eventEmitter, logger, message, ctx);

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
