import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger } from '@zro/common';
import { KeyState, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  PixKeyGateway,
  PixKeyNotFoundException,
} from '@zro/pix-keys/application';
import {
  PixKeyModel,
  PixKeyClaimModel,
  ConfirmOwnershipClaimProcessMicroserviceController as Controller,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import {
  ConfirmOwnershipClaimProcessRequest,
  PixKeyEventEmitterControllerInterface,
  PixKeyEventType,
} from '@zro/pix-keys/interface';
import { PixKeyClaimFactory, PixKeyFactory } from '@zro/test/pix-keys/config';
import * as finishClaimPixKeyPspGatewayMock from '@zro/test/pix-keys/config/mocks/finish_claim_pix_key.mock';

describe('ConfirmOwnershipClaimProcessMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let pixKeyRepository: PixKeyRepository;

  const pixKeyEventService: PixKeyEventEmitterControllerInterface =
    createMock<PixKeyEventEmitterControllerInterface>();
  const mockEmitPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.emitPixKeyEvent),
  );

  const pspGateway: PixKeyGateway = createMock<PixKeyGateway>();
  const mockFinishClaimPixKeyPspGateway: jest.Mock = On(pspGateway).get(
    method((mock) => mock.finishClaimPixKey),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PixKeyEventKafkaEmitter)
      .useValue(pixKeyEventService)
      .compile();

    controller = module.get<Controller>(Controller);
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('ConfirmOwnershipClaimProcess', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should ready process successfully', async () => {
        mockFinishClaimPixKeyPspGateway.mockImplementationOnce(
          finishClaimPixKeyPspGatewayMock.success,
        );

        const claim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
          PixKeyClaimModel.name,
        );
        const { id, key, type, createdAt } =
          await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
            state: KeyState.OWNERSHIP_STARTED,
            claim,
          });

        const message: ConfirmOwnershipClaimProcessRequest = {
          key,
        };

        const result = await controller.execute(
          pixKeyRepository,
          pixKeyEventService,
          logger,
          message,
          pspGateway,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toMatchObject({
          id,
          key,
          type,
          state: KeyState.OWNERSHIP_CONFIRMED,
          createdAt,
        });
        expect(mockFinishClaimPixKeyPspGateway).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent.mock.calls[0][0]).toBe(
          PixKeyEventType.OWNERSHIP_CONFIRMED,
        );
      });

      it('TC0002 - Should confirm ownership process with already ownership confirmed key successfully', async () => {
        const { id, key, type, createdAt } =
          await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
            state: KeyState.OWNERSHIP_CONFIRMED,
          });

        const message: ConfirmOwnershipClaimProcessRequest = {
          key,
        };

        const result = await controller.execute(
          pixKeyRepository,
          pixKeyEventService,
          logger,
          message,
          pspGateway,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toMatchObject({
          id,
          key,
          type,
          state: KeyState.OWNERSHIP_CONFIRMED,
          createdAt,
        });
        expect(mockFinishClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0003 - Should not ready ownership process on a canceled key', async () => {
        const { key } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          {
            state: KeyState.CANCELED,
          },
        );

        const message: ConfirmOwnershipClaimProcessRequest = {
          key,
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyEventService,
            logger,
            message,
            pspGateway,
            ctx,
          );

        await expect(testScript).rejects.toThrow(PixKeyNotFoundException);
        expect(mockFinishClaimPixKeyPspGateway).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
