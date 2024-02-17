import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { AppModule } from '@zro/otc-bot/infrastructure/nest/modules/app.module';
import {
  BotOtcOrderDatabaseRepository,
  BotOtcOrderModel,
  GetBotOtcOrderByIdMicroserviceController as Controller,
} from '@zro/otc-bot/infrastructure';
import { KafkaContext } from '@nestjs/microservices';
import { BotOtcOrderRepository } from '@zro/otc-bot/domain';
import { BotOtcOrderFactory } from '@zro/test/otc-bot/config';
import { GetBotOtcOrderByIdRequest } from '@zro/otc-bot/interface';

describe('GetBotOtcOrderByIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let botOtcOrderRepository: BotOtcOrderRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);

    botOtcOrderRepository = new BotOtcOrderDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('Get bot otc order by id.', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get bot otc order by id successfully.', async () => {
        const { id } = await BotOtcOrderFactory.create<BotOtcOrderModel>(
          BotOtcOrderModel.name,
        );

        const message: GetBotOtcOrderByIdRequest = {
          id,
        };

        const result = await controller.execute(
          botOtcOrderRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not get bot otc order with invalid id', async () => {
        const message: GetBotOtcOrderByIdRequest = {
          id: uuidV4(),
        };

        const result = await controller.execute(
          botOtcOrderRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeNull();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
