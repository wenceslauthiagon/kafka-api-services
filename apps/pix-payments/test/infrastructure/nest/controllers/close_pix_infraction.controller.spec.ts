import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  PixInfractionRefundOperationRepository,
  PixInfractionRepository,
  PixInfractionState,
} from '@zro/pix-payments/domain';
import { PixInfractionNotFoundException } from '@zro/pix-payments/application';
import {
  ClosePixInfractionMicroserviceController as Controller,
  PixInfractionDatabaseRepository,
  PixInfractionModel,
  OperationServiceKafka,
  PixInfractionRefundOperationDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  ClosePixInfractionRequest,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import { InfractionFactory } from '@zro/test/pix-payments/config';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';

describe('ClosePixInfractionMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let infractionRepository: PixInfractionRepository;
  let pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository;

  const eventEmitter: PixInfractionEventEmitterControllerInterface =
    createMock<PixInfractionEventEmitterControllerInterface>();

  const mockEmitInfractionEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitInfractionEvent),
  );

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    infractionRepository = new PixInfractionDatabaseRepository();
    pixInfractionRefundOperationRepository =
      new PixInfractionRefundOperationDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('ClosePixInfraction', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not close if infraction not exists', async () => {
        const issueId = faker.datatype.number({ min: 1, max: 99999 });
        const { analysisDetails, analysisResult } =
          await InfractionFactory.create<PixInfractionModel>(
            PixInfractionModel.name,
          );

        const message: ClosePixInfractionRequest = {
          issueId,
          analysisDetails,
          analysisResult,
        };

        const testScript = () =>
          controller.execute(
            logger,
            infractionRepository,
            pixInfractionRefundOperationRepository,
            eventEmitter,
            operationService,
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
      it('TC0002 - Should close infraction successfully', async () => {
        const { issueId, analysisDetails, analysisResult } =
          await InfractionFactory.create<PixInfractionModel>(
            PixInfractionModel.name,
          );

        const message: ClosePixInfractionRequest = {
          issueId,
          analysisDetails,
          analysisResult,
        };

        await controller.execute(
          logger,
          infractionRepository,
          pixInfractionRefundOperationRepository,
          eventEmitter,
          operationService,
          message,
          ctx,
        );

        expect(mockEmitInfractionEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitInfractionEvent.mock.calls[0][1].state).toBe(
          PixInfractionState.CLOSED_PENDING,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
