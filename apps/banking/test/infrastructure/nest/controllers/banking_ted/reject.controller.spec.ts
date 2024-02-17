import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger as logger } from '@zro/common';
import { BankingTedState } from '@zro/banking/domain';
import { BankingTedNotFoundException } from '@zro/banking/application';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import {
  BankingTedEventEmitterControllerInterface,
  RejectBankingTedRequest,
} from '@zro/banking/interface';
import {
  RejectBankingTedMicroserviceController as Controller,
  BankingTedDatabaseRepository,
  BankingTedFailureDatabaseRepository,
  OperationServiceKafka,
  BankingTedModel,
} from '@zro/banking/infrastructure';
import { BankingTedFactory } from '@zro/test/banking/config';
import { WalletFactory } from '@zro/test/operations/config';
import { WalletEntity, WalletState } from '@zro/operations/domain';
import {
  WalletNotActiveException,
  WalletNotFoundException,
} from '@zro/operations/application';
import { KafkaContext } from '@nestjs/microservices';

describe('RejectBankingTedMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let bankingTedRepository: BankingTedDatabaseRepository;
  let bankingTedFailureRepository: BankingTedFailureDatabaseRepository;

  const bankingTedEmitter: BankingTedEventEmitterControllerInterface =
    createMock<BankingTedEventEmitterControllerInterface>();
  const mockEmitBankingTedStaticEvent: jest.Mock = On(bankingTedEmitter).get(
    method((mock) => mock.emitBankingTedEvent),
  );

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockGetWalletByUserAndDefaultIsTrueService: jest.Mock = On(
    operationService,
  ).get(method((mock) => mock.getWalletByUserAndDefaultIsTrue));

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    bankingTedRepository = new BankingTedDatabaseRepository();
    bankingTedFailureRepository = new BankingTedFailureDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('RejectBankingTed', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should reject successfully', async () => {
        const bankingTed = await BankingTedFactory.create<BankingTedModel>(
          BankingTedModel.name,
          { state: BankingTedState.CONFIRMED },
        );

        const wallet = await WalletFactory.create<WalletEntity>(
          WalletEntity.name,
          { state: WalletState.ACTIVE, user: bankingTed.user },
        );

        mockGetWalletByUserAndDefaultIsTrueService.mockResolvedValueOnce(
          wallet,
        );

        const message: RejectBankingTedRequest = {
          id: bankingTed.id,
          code: 'test',
          message: 'test',
        };

        const result = await controller.execute(
          bankingTedRepository,
          bankingTedFailureRepository,
          bankingTedEmitter,
          operationService,
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
          BankingTedState.FAILED,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - should dont reject bankingTed when not found', async () => {
        const bankingTedId = faker.datatype.number({ min: 1, max: 9999 });

        const message: RejectBankingTedRequest = {
          id: bankingTedId,
          code: 'test',
          message: 'test',
        };

        const testScript = () =>
          controller.execute(
            bankingTedRepository,
            bankingTedFailureRepository,
            bankingTedEmitter,
            operationService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(BankingTedNotFoundException);
        expect(mockEmitBankingTedStaticEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - should dont reject bankingTed when wallet not found', async () => {
        const bankingTed = await BankingTedFactory.create<BankingTedModel>(
          BankingTedModel.name,
          { state: BankingTedState.CONFIRMED },
        );

        mockGetWalletByUserAndDefaultIsTrueService.mockResolvedValueOnce(null);

        const message: RejectBankingTedRequest = {
          id: bankingTed.id,
          code: 'test',
          message: 'test',
        };

        const testScript = () =>
          controller.execute(
            bankingTedRepository,
            bankingTedFailureRepository,
            bankingTedEmitter,
            operationService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(WalletNotFoundException);
        expect(mockEmitBankingTedStaticEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0004 - should dont reject bankingTed when wallet is not active', async () => {
        const bankingTed = await BankingTedFactory.create<BankingTedModel>(
          BankingTedModel.name,
          { state: BankingTedState.CONFIRMED },
        );
        const wallet = await WalletFactory.create<WalletEntity>(
          WalletEntity.name,
          { state: WalletState.DEACTIVATE },
        );

        mockGetWalletByUserAndDefaultIsTrueService.mockResolvedValueOnce(
          wallet,
        );

        const message: RejectBankingTedRequest = {
          id: bankingTed.id,
          code: 'test',
          message: 'test',
        };

        const testScript = () =>
          controller.execute(
            bankingTedRepository,
            bankingTedFailureRepository,
            bankingTedEmitter,
            operationService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(WalletNotActiveException);
        expect(mockEmitBankingTedStaticEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
