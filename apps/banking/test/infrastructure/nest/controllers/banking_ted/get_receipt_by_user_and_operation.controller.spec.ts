import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  ReceiptPortugueseTranslation,
} from '@zro/common';
import { BankingTedRepository, BankingTedState } from '@zro/banking/domain';
import {
  BankingTedModel,
  GetBankingTedReceiptByUserAndOperationMicroserviceController as Controller,
  BankingTedDatabaseRepository,
  UserServiceKafka,
} from '@zro/banking/infrastructure';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import { BankingTedFactory } from '@zro/test/banking/config';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { KafkaContext } from '@nestjs/microservices';
import { GetBankingTedReceiptByUserAndOperationRequest } from '@zro/banking/interface';

describe('GetBankingTedReceiptByUserAndOperationMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let bankingTedRepository: BankingTedRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    controller = module.get<Controller>(Controller);
    bankingTedRepository = new BankingTedDatabaseRepository();
  });

  const userService: UserServiceKafka = createMock<UserServiceKafka>();
  const mockGetUserService: jest.Mock = On(userService).get(
    method((mock) => mock.getUserByUuid),
  );

  beforeEach(() => jest.resetAllMocks());

  describe('GetBankingTedReceiptByUserAndOperation', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get bankingTed receipt successfully', async () => {
        const bankingTed = await BankingTedFactory.create<BankingTedModel>(
          BankingTedModel.name,
          {
            state: BankingTedState.FORWARDED,
          },
        );

        const { userId, operationId } = bankingTed;

        const message: GetBankingTedReceiptByUserAndOperationRequest = {
          userId,
          operationId,
        };

        mockGetUserService.mockResolvedValue(bankingTed.user);

        const result = await controller.execute(
          bankingTedRepository,
          userService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value.paymentData).toBeDefined();
        expect(result.value.paymentTitle).toBe(
          ReceiptPortugueseTranslation.ted,
        );
        expect(result.value.operationId).toBe(operationId);
        expect(result.value.isScheduled).toBe(false);
        expect(result.value.activeDevolution).toBe(false);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
