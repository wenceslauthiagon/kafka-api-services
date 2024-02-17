import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  PixInfractionRepository,
  PixInfractionState,
} from '@zro/pix-payments/domain';
import { PixInfractionNotFoundException } from '@zro/pix-payments/application';
import {
  CancelPixInfractionMicroserviceController as Controller,
  PixInfractionDatabaseRepository,
  PixInfractionModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  CancelPixInfractionRequest,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import { InfractionFactory } from '@zro/test/pix-payments/config';

describe('CancelInfractionMicroserviceController', () => {
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

  describe('CancelInfraction', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not cancel if infraction not exists', async () => {
        const issueId = faker.datatype.number({ min: 1, max: 99999 });

        const message: CancelPixInfractionRequest = {
          issueId,
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
      it('TC0002 - Should cancel infraction successfully', async () => {
        const { issueId } = await InfractionFactory.create<PixInfractionModel>(
          PixInfractionModel.name,
          { state: PixInfractionState.OPEN_PENDING },
        );

        const message: CancelPixInfractionRequest = { issueId };

        await controller.execute(
          logger,
          infractionRepository,
          eventEmitter,
          message,
          ctx,
        );

        expect(mockEmitInfractionEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitInfractionEvent.mock.calls[0][1].state).toBe(
          PixInfractionState.CANCEL_PENDING,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
