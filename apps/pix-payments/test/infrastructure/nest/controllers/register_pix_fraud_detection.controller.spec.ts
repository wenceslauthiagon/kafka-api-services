import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import {
  PixFraudDetectionEntity,
  PixFraudDetectionRepository,
  PixFraudDetectionState,
  PixFraudDetectionType,
} from '@zro/pix-payments/domain';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  RegisterPixFraudDetectionMicroserviceController as Controller,
  PixFraudDetectionDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  RegisterPixFraudDetectionRequest,
  PixFraudDetectionEventEmitterControllerInterface,
  PixFraudDetectionEventType,
} from '@zro/pix-payments/interface';
import { PixFraudDetectionFactory } from '@zro/test/pix-payments/config';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf } from 'cpf-cnpj-validator';

describe('RegisterPixFraudDetectionMicroserviceController', () => {
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
        await PixFraudDetectionFactory.create<PixFraudDetectionEntity>(
          PixFraudDetectionEntity.name,
          {
            issueId: faker.datatype.number({ min: 1, max: 999 }),
          },
        );

      const message: RegisterPixFraudDetectionRequest = {
        id: pixFraudDetection.id,
        issueId: pixFraudDetection.issueId,
        document: pixFraudDetection.document,
        fraudType: pixFraudDetection.fraudType,
        key: pixFraudDetection.key,
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
        PixFraudDetectionState.REGISTERED_PENDING,
      );
      expect(mockEmitEvent).toHaveBeenCalledTimes(1);
      expect(mockEmitEvent.mock.calls[0][0]).toBe(
        PixFraudDetectionEventType.REGISTERED_PENDING,
      );
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should throw InvalidDataFormatException when missing params', async () => {
      const message: RegisterPixFraudDetectionRequest = {
        id: faker.datatype.uuid(),
        issueId: null,
        document: cpf.generate(),
        fraudType: PixFraudDetectionType.DUMMY_ACCOUNT,
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
