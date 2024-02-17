import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger as logger } from '@zro/common';
import { BankingTedState } from '@zro/banking/domain';
import { BankingTedNotFoundException } from '@zro/banking/application';
import {
  BankingTedEventEmitterControllerInterface,
  ForwardBankingTedRequest,
} from '@zro/banking/interface';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import {
  ForwardBankingTedMicroserviceController as Controller,
  BankingTedDatabaseRepository,
  BankingTedModel,
} from '@zro/banking/infrastructure';
import { BankingTedFactory } from '@zro/test/banking/config';
import { KafkaContext } from '@nestjs/microservices';

describe('ForwardBankingTedMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let bankingTedRepository: BankingTedDatabaseRepository;

  const bankingTedEmitter: BankingTedEventEmitterControllerInterface =
    createMock<BankingTedEventEmitterControllerInterface>();
  const mockEmitBankingTedStaticEvent: jest.Mock = On(bankingTedEmitter).get(
    method((mock) => mock.emitBankingTedEvent),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    bankingTedRepository = new BankingTedDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('ForwardBankingTed', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should forward successfully', async () => {
        const bankingTed = await BankingTedFactory.create<BankingTedModel>(
          BankingTedModel.name,
          { state: BankingTedState.CONFIRMED },
        );

        const message: ForwardBankingTedRequest = {
          id: bankingTed.id,
        };

        const result = await controller.execute(
          bankingTedRepository,
          bankingTedEmitter,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.state).toBeDefined();
        expect(result.value.createdAt).toBeDefined();
        expect(mockEmitBankingTedStaticEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitBankingTedStaticEvent.mock.calls[0][0]).toBe(
          BankingTedState.FORWARDED,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - should dont forward bankingTed when not found', async () => {
        const bankingTedId = faker.datatype.number({ min: 1, max: 9999 });

        const message: ForwardBankingTedRequest = {
          id: bankingTedId,
        };

        const testScript = () =>
          controller.execute(
            bankingTedRepository,
            bankingTedEmitter,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(BankingTedNotFoundException);
        expect(mockEmitBankingTedStaticEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
