import { createMock } from 'ts-auto-mock';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  BotOtcControl,
  BotOtcEntity,
  BotOtcRepository,
} from '@zro/otc-bot/domain';
import { UpdateBotOtcRequest } from '@zro/otc-bot/interface';
import {
  BotOtcDatabaseRepository,
  BotOtcModel,
  UpdateBotOtcMicroServiceController as Controller,
} from '@zro/otc-bot/infrastructure';
import { BotOtcFactory } from '@zro/test/otc-bot/config';
import { AppModule } from '@zro/otc-bot/infrastructure/nest/modules/app.module';
import { KafkaContext } from '@nestjs/microservices';
import { BotOtcNotFoundException } from '@zro/otc-bot/application';

describe('UpdateBotOtcMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let botOtcRepository: BotOtcRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    botOtcRepository = new BotOtcDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('UpdateBotOtc', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should throw not create if missing params', async () => {
        const message: UpdateBotOtcRequest = {
          id: faker.datatype.uuid(),
          spread: null,
          balance: null,
          control: null,
          step: null,
        };

        const test = () =>
          controller.execute(botOtcRepository, logger, message, ctx);

        await expect(test).rejects.toThrow(MissingDataException);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should throw BotOtcNotFoundException if botOtc not found', async () => {
        const botOtc = await BotOtcFactory.create<BotOtcEntity>(
          BotOtcEntity.name,
          {
            control: BotOtcControl.STOP,
          },
        );

        const message: UpdateBotOtcRequest = {
          id: botOtc.id,
          step: botOtc.step,
          control: botOtc.control,
          balance: botOtc.balance,
          spread: botOtc.spread,
        };

        const test = () =>
          controller.execute(botOtcRepository, logger, message, ctx);

        await expect(test).rejects.toThrow(BotOtcNotFoundException);
      });

      it('TC0003 - Should update successfully', async () => {
        const botOtc = await BotOtcFactory.create<BotOtcModel>(
          BotOtcModel.name,
        );

        const toUpdateBotOtc = await BotOtcFactory.create<BotOtcEntity>(
          BotOtcEntity.name,
          {
            id: botOtc.id,
            control: BotOtcControl.STOP,
          },
        );

        const message: UpdateBotOtcRequest = {
          id: toUpdateBotOtc.id,
          step: toUpdateBotOtc.step,
          control: toUpdateBotOtc.control,
          balance: toUpdateBotOtc.balance,
          spread: toUpdateBotOtc.spread,
        };

        const result = await controller.execute(
          botOtcRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.spread).toBe(toUpdateBotOtc.spread);
        expect(result.value.balance).toBe(toUpdateBotOtc.balance);
        expect(result.value.step).toBe(toUpdateBotOtc.step);
        expect(result.value.control).toBe(BotOtcControl.STOP);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
