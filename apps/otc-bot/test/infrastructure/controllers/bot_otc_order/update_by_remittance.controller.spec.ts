import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { AppModule } from '@zro/otc-bot/infrastructure/nest/modules/app.module';
import {
  BotOtcOrderDatabaseRepository,
  BotOtcOrderModel,
  UpdateBotOtcOrderByRemittanceMicroserviceController as Controller,
  OtcServiceKafka,
} from '@zro/otc-bot/infrastructure';

import { BotOtcOrderRepository } from '@zro/otc-bot/domain';
import {
  BotOtcOrderEventEmitterControllerInterface,
  BotOtcOrderEventType,
  UpdateBotOtcOrderByRemittanceRequest,
} from '@zro/otc-bot/interface';

import { BotOtcOrderNotFoundException } from '@zro/otc-bot/application';
import { CryptoOrderFactory, RemittanceFactory } from '@zro/test/otc/config';
import { BotOtcOrderFactory } from '@zro/test/otc-bot/config';
import { CryptoOrderEntity, RemittanceEntity } from '@zro/otc/domain';
import { RemittanceNotFoundException } from '@zro/otc/application';

describe('UpdateBotOtcOrderByRemittanceMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let botOtcOrderRepository: BotOtcOrderRepository;

  const botOtcOrderEventEmitter: BotOtcOrderEventEmitterControllerInterface =
    createMock<BotOtcOrderEventEmitterControllerInterface>();
  const mockEmitCompletedWithRemittanceBotOtcOrderEvent: jest.Mock = On(
    botOtcOrderEventEmitter,
  ).get(method((mock) => mock.emitBotOtcOrderEvent));

  const otcService: OtcServiceKafka = createMock<OtcServiceKafka>();
  const mockGetRemittanceByIdService: jest.Mock = On(otcService).get(
    method((mock) => mock.getRemittanceById),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);

    botOtcOrderRepository = new BotOtcOrderDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('Update Bot Otc Order by remittance.', () => {
    describe('With invalid parameters.', () => {
      it('TC0001 - Should throw InvalidDataFormatException if missing params.', async () => {
        const message: UpdateBotOtcOrderByRemittanceRequest = {
          remittanceBankQuote: null,
          cryptoOrderId: null,
          remittanceId: null,
        };

        const testScript = () =>
          controller.execute(
            botOtcOrderRepository,
            botOtcOrderEventEmitter,
            otcService,
            logger,
            message,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(
          mockEmitCompletedWithRemittanceBotOtcOrderEvent,
        ).toHaveBeenCalledTimes(0);
        expect(mockGetRemittanceByIdService).toHaveBeenCalledTimes(0);
      });

      it('TC0002 - Should throw RemittanceNotFoundException if Remittance not found.', async () => {
        const message: UpdateBotOtcOrderByRemittanceRequest = {
          remittanceBankQuote: faker.datatype.number({ min: 1, max: 999999 }),
          remittanceId: faker.datatype.uuid(),
          cryptoOrderId: faker.datatype.uuid(),
        };

        const testScript = () =>
          controller.execute(
            botOtcOrderRepository,
            botOtcOrderEventEmitter,
            otcService,
            logger,
            message,
          );

        await expect(testScript).rejects.toThrow(RemittanceNotFoundException);
        expect(
          mockEmitCompletedWithRemittanceBotOtcOrderEvent,
        ).toHaveBeenCalledTimes(0);
        expect(mockGetRemittanceByIdService).toHaveBeenCalledTimes(1);
      });

      it('TC0003 - Should throw BotOtcOrderNotFoundException if Bot Otc order not found.', async () => {
        const remittance = await RemittanceFactory.create<RemittanceEntity>(
          RemittanceEntity.name,
          {
            bankQuote: faker.datatype.number({ min: 1, max: 999999 }),
          },
        );

        const message: UpdateBotOtcOrderByRemittanceRequest = {
          remittanceBankQuote: remittance.bankQuote,
          remittanceId: remittance.id,
          cryptoOrderId: faker.datatype.uuid(),
        };

        const testScript = () =>
          controller.execute(
            botOtcOrderRepository,
            botOtcOrderEventEmitter,
            otcService,
            logger,
            message,
          );

        mockGetRemittanceByIdService.mockResolvedValue(remittance);

        await expect(testScript).rejects.toThrow(BotOtcOrderNotFoundException);
        expect(
          mockEmitCompletedWithRemittanceBotOtcOrderEvent,
        ).toHaveBeenCalledTimes(0);
        expect(mockGetRemittanceByIdService).toHaveBeenCalledTimes(1);
      });
    });

    describe('With valid parameters.', () => {
      it('TC0004 - Should update a Bot Otc Order by remittance successfully.', async () => {
        const remittance = await RemittanceFactory.create<RemittanceEntity>(
          RemittanceEntity.name,
          {
            bankQuote: faker.datatype.number({ min: 1, max: 999999 }),
          },
        );

        const cryptoOrder = await CryptoOrderFactory.create<CryptoOrderEntity>(
          CryptoOrderEntity.name,
        );

        await BotOtcOrderFactory.create<BotOtcOrderModel>(
          BotOtcOrderModel.name,
          { buyRemittance: remittance, buyOrderId: cryptoOrder.id },
        );

        const message: UpdateBotOtcOrderByRemittanceRequest = {
          remittanceBankQuote: remittance.bankQuote,
          cryptoOrderId: cryptoOrder.id,
          remittanceId: remittance.id,
        };

        mockGetRemittanceByIdService.mockResolvedValue(remittance);

        await controller.execute(
          botOtcOrderRepository,
          botOtcOrderEventEmitter,
          otcService,
          logger,
          message,
        );

        expect(mockGetRemittanceByIdService).toHaveBeenCalledTimes(1);
        expect(
          mockEmitCompletedWithRemittanceBotOtcOrderEvent,
        ).toHaveBeenCalledTimes(1);
        expect(
          mockEmitCompletedWithRemittanceBotOtcOrderEvent.mock.calls[0][0],
        ).toBe(BotOtcOrderEventType.COMPLETED_WITH_REMITTANCE);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
