import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import { PixInfractionNotFoundException } from '@zro/pix-payments/application';
import {
  PixInfractionRepository,
  PixInfractionStatus,
  PixInfractionState,
} from '@zro/pix-payments/domain';
import {
  InAnalysisPixInfractionMicroserviceController as Controller,
  PixInfractionDatabaseRepository,
  PixInfractionModel,
} from '@zro/pix-payments/infrastructure';
import {
  InAnalysisPixInfractionRequest,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import { InfractionFactory } from '@zro/test/pix-payments/config';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { KafkaContext } from '@nestjs/microservices';

describe('InAnalysisInfractionReceivedMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let infractionRepository: PixInfractionRepository;

  const eventEmitter: PixInfractionEventEmitterControllerInterface =
    createMock<PixInfractionEventEmitterControllerInterface>();
  const mockEmitInfractionEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitInfractionEvent),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    infractionRepository = new PixInfractionDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('InAnalysisInfractionReceived', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not update without issueId', async () => {
        const message: InAnalysisPixInfractionRequest = {
          issueId: null,
          description: null,
        };

        const testScript = () =>
          controller.execute(
            logger,
            infractionRepository,
            eventEmitter,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockEmitInfractionEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0002 - Should not update if infraction no exists', async () => {
        const message: InAnalysisPixInfractionRequest = {
          issueId: faker.datatype.number({ min: 1, max: 99999 }),
          description: faker.datatype.string(),
        };

        const testScript = () =>
          controller.execute(
            logger,
            infractionRepository,
            eventEmitter,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(
          PixInfractionNotFoundException,
        );
        expect(mockEmitInfractionEvent).toHaveBeenCalledTimes(0);
      });
    });

    describe('With valid parameters', () => {
      it('TC0003 - Should update infraction successfully', async () => {
        const { issueId, description } =
          await InfractionFactory.create<PixInfractionModel>(
            PixInfractionModel.name,
          );

        const message: InAnalysisPixInfractionRequest = {
          issueId,
          description,
        };

        const result = await controller.execute(
          logger,
          infractionRepository,
          eventEmitter,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.state).toBe(
          PixInfractionState.IN_ANALYSIS_CONFIRMED,
        );
        expect(result.value.status).toBe(PixInfractionStatus.IN_ANALYSIS);

        expect(mockEmitInfractionEvent).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
