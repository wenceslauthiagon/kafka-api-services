import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import { PixInfractionNotFoundException } from '@zro/pix-payments/application';
import { PixInfractionRepository } from '@zro/pix-payments/domain';
import {
  AcknowledgePixInfractionNestObserver as Observer,
  PixInfractionDatabaseRepository,
  PixInfractionModel,
} from '@zro/pix-payments/infrastructure';
import {
  HandleAcknowledgePixInfractionEventRequest,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import { InfractionFactory } from '@zro/test/pix-payments/config';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';

describe('AcknowledgeInfractionNesAcknowledgePixInfractionNestObserver', () => {
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

  describe('AcknowledgeInfraction', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not create without infractionPspId', async () => {
        const message: HandleAcknowledgePixInfractionEventRequest = {
          infractionPspId: null,
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
        const message: HandleAcknowledgePixInfractionEventRequest = {
          infractionPspId: faker.datatype.uuid(),
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

        const message: HandleAcknowledgePixInfractionEventRequest = {
          infractionPspId,
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
