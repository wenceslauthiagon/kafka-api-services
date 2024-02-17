import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import { PixInfractionNotFoundException } from '@zro/pix-payments/application';
import {
  PixInfractionRepository,
  PixInfractionAnalysisResultType,
  PixInfractionRefundOperationRepository,
} from '@zro/pix-payments/domain';
import {
  CancelPixInfractionReceivedNestObserver as Observer,
  PixInfractionDatabaseRepository,
  PixInfractionModel,
  OperationServiceKafka,
  PixInfractionRefundOperationDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  HandleCancelPixInfractionReceivedEventRequest,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import { InfractionFactory } from '@zro/test/pix-payments/config';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
describe('CancelInfractionReceivedNestCancelPixInfractionReceivedNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let infractionRepository: PixInfractionRepository;
  let pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository;

  const eventEmitter: PixInfractionEventEmitterControllerInterface =
    createMock<PixInfractionEventEmitterControllerInterface>();
  const mockEmitInfractionEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitInfractionEvent),
  );

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Observer>(Observer);
    infractionRepository = new PixInfractionDatabaseRepository();
    pixInfractionRefundOperationRepository =
      new PixInfractionRefundOperationDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CancelInfractionReceived', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not cancel without infractionPspId', async () => {
        const message: HandleCancelPixInfractionReceivedEventRequest = {
          analysisResult: PixInfractionAnalysisResultType.AGREED,
          infractionPspId: null,
          analysisDetails: faker.random.word(),
        };

        const testScript = () =>
          controller.execute(
            logger,
            infractionRepository,
            pixInfractionRefundOperationRepository,
            operationService,
            eventEmitter,
            message,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockEmitInfractionEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0002 - Should not cancel if infraction no exists', async () => {
        const message: HandleCancelPixInfractionReceivedEventRequest = {
          analysisResult: PixInfractionAnalysisResultType.AGREED,
          infractionPspId: faker.datatype.uuid(),
          analysisDetails: faker.random.word(),
        };

        const testScript = () =>
          controller.execute(
            logger,
            infractionRepository,
            pixInfractionRefundOperationRepository,
            operationService,
            eventEmitter,
            message,
          );

        await expect(testScript).rejects.toThrow(
          PixInfractionNotFoundException,
        );
        expect(mockEmitInfractionEvent).toHaveBeenCalledTimes(0);
      });
    });

    describe('With valid parameters', () => {
      it('TC0003 - Should cancel infraction successfully', async () => {
        const { infractionPspId } =
          await InfractionFactory.create<PixInfractionModel>(
            PixInfractionModel.name,
          );

        const message: HandleCancelPixInfractionReceivedEventRequest = {
          analysisResult: PixInfractionAnalysisResultType.AGREED,
          infractionPspId,
          analysisDetails: faker.random.word(),
        };

        await controller.execute(
          logger,
          infractionRepository,
          pixInfractionRefundOperationRepository,
          operationService,
          eventEmitter,
          message,
        );

        expect(mockEmitInfractionEvent).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
