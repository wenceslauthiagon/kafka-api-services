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
} from '@zro/pix-payments/domain';
import {
  ClosePixInfractionReceivedNestObserver as Observer,
  PixInfractionDatabaseRepository,
  PixInfractionModel,
} from '@zro/pix-payments/infrastructure';
import {
  HandleClosePixInfractionReceivedEventRequest,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import { InfractionFactory } from '@zro/test/pix-payments/config';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';

describe('CloseInfractionReceivedNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let infractionRepository: PixInfractionRepository;

  const eventEmitter: PixInfractionEventEmitterControllerInterface =
    createMock<PixInfractionEventEmitterControllerInterface>();
  const mockEmitInfractionEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitInfractionEvent),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Observer>(Observer);
    infractionRepository = new PixInfractionDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CloseInfractionReceived', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not create without infractionPspId', async () => {
        const message: HandleClosePixInfractionReceivedEventRequest = {
          analysisResult: PixInfractionAnalysisResultType.AGREED,
          infractionPspId: null,
          analysisDetails: faker.random.word(),
        };

        const testScript = () =>
          controller.execute(
            logger,
            infractionRepository,
            eventEmitter,
            message,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockEmitInfractionEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0002 - Should not create if infraction no exists', async () => {
        const message: HandleClosePixInfractionReceivedEventRequest = {
          analysisResult: PixInfractionAnalysisResultType.AGREED,
          infractionPspId: faker.datatype.uuid(),
          analysisDetails: faker.random.word(),
        };

        const testScript = () =>
          controller.execute(
            logger,
            infractionRepository,
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
      it('TC0003 - Should create infraction successfully', async () => {
        const { infractionPspId } =
          await InfractionFactory.create<PixInfractionModel>(
            PixInfractionModel.name,
          );

        const message: HandleClosePixInfractionReceivedEventRequest = {
          analysisResult: PixInfractionAnalysisResultType.AGREED,
          infractionPspId,
          analysisDetails: faker.random.word(),
        };

        await controller.execute(
          logger,
          infractionRepository,
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
