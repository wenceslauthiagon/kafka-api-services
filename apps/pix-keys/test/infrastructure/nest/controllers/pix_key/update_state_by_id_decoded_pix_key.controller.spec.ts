import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger } from '@zro/common';
import {
  DecodedPixKeyRepository,
  DecodedPixKeyState,
} from '@zro/pix-keys/domain';
import {
  DecodedPixKeyModel,
  UpdateStateByIdDecodedPixKeyMicroserviceController as Controller,
  DecodedPixKeyDatabaseRepository,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import {
  DecodedPixKeyEventEmitterControllerInterface,
  DecodedPixKeyEventType,
  UpdateStateByIdDecodedPixKeyRequest,
} from '@zro/pix-keys/interface';
import { DecodedPixKeyNotFoundException } from '@zro/pix-keys/application';
import { DecodedPixKeyFactory } from '@zro/test/pix-keys/config';
import { On, method } from 'ts-auto-mock/extension';

describe('UpdateStateByIdPixKeyMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let decodedPixKeyRepository: DecodedPixKeyRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  const decodedPixKeyEmitter: DecodedPixKeyEventEmitterControllerInterface =
    createMock<DecodedPixKeyEventEmitterControllerInterface>();
  const mockEmitEvent: jest.Mock = On(decodedPixKeyEmitter).get(
    method((mock) => mock.emitDecodedPixKeyEvent),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    decodedPixKeyRepository = new DecodedPixKeyDatabaseRepository();
  });

  describe('GetByIdDecodedPixKey', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should update state decoded pix key successfully', async () => {
        const state = DecodedPixKeyState.CONFIRMED;
        const { id } = await DecodedPixKeyFactory.create<DecodedPixKeyModel>(
          DecodedPixKeyModel.name,
        );

        const message: UpdateStateByIdDecodedPixKeyRequest = {
          id,
          state,
        };

        const result = await controller.execute(
          decodedPixKeyRepository,
          decodedPixKeyEmitter,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value.state).toBe(DecodedPixKeyState.CONFIRMED);
        expect(mockEmitEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitEvent.mock.calls[0][0]).toBe(
          DecodedPixKeyEventType.CONFIRMED,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not update decoded pix keys with invalid id', async () => {
        const state = DecodedPixKeyState.CONFIRMED;
        const message: UpdateStateByIdDecodedPixKeyRequest = {
          id: uuidV4(),
          state,
        };

        const testScript = () =>
          controller.execute(
            decodedPixKeyRepository,
            decodedPixKeyEmitter,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(
          DecodedPixKeyNotFoundException,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
