import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  NotifyRegisterBankingTedEntity,
  NotifyRegisterBankingTedRepository,
  NotifyRegisterBankingTedStatus,
} from '@zro/api-topazio/domain';
import {
  NotifyRegisterBankingTedTopazioNestObserver as Observer,
  NotifyRegisterBankingTedDatabaseRepository,
  BankingServiceKafka,
  AdminBankingServiceKafka,
} from '@zro/api-topazio/infrastructure';
import { AppModule } from '@zro/api-topazio/infrastructure/nest/modules/app.module';
import { NotifyRegisterBankingTedFactory } from '@zro/test/api-topazio/config';
import { BankingTedFactory } from '@zro/test/banking/config';
import { BankingTedEntity } from '@zro/banking/domain';
import { HandleNotifyRegisterBankingTedTopazioEventRequest } from '@zro/api-topazio/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('NotifyRegisterBankingTedTopazioNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let notifyRegisterBankingTedRepository: NotifyRegisterBankingTedRepository;

  const bankingService: BankingServiceKafka = createMock<BankingServiceKafka>();
  const mockGetBankingService: jest.Mock = On(bankingService).get(
    method((mock) => mock.getBankingTedByTransactionId),
  );
  const mockRejectBankingService: jest.Mock = On(bankingService).get(
    method((mock) => mock.rejectBankingTed),
  );
  const mockForwardBankingService: jest.Mock = On(bankingService).get(
    method((mock) => mock.forwardBankingTed),
  );

  const adminBankingService: AdminBankingServiceKafka =
    createMock<AdminBankingServiceKafka>();
  const mockForwardAdminBankingService: jest.Mock = On(adminBankingService).get(
    method((mock) => mock.forwardAdminBankingTed),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Observer>(Observer);
    notifyRegisterBankingTedRepository =
      new NotifyRegisterBankingTedDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleNotifyRegisterBankingTedTopazioEventViaBanking', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle notify register successfully when status error', async () => {
        const data =
          await NotifyRegisterBankingTedFactory.create<NotifyRegisterBankingTedEntity>(
            NotifyRegisterBankingTedEntity.name,
            { status: NotifyRegisterBankingTedStatus.ERROR },
          );
        const message: HandleNotifyRegisterBankingTedTopazioEventRequest = {
          transactionId: data.transactionId,
          status: data.status,
        };

        const spyCreate = jest.spyOn(
          notifyRegisterBankingTedRepository,
          'create',
        );
        const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
          BankingTedEntity.name,
        );
        mockGetBankingService.mockResolvedValue(bankingTed);

        await controller.handleNotifyRegisterBankingTedTopazioEventViaBanking(
          message,
          logger,
          notifyRegisterBankingTedRepository,
          bankingService,
          adminBankingService,
          ctx,
        );

        expect(spyCreate).toHaveBeenCalledTimes(1);
        expect(mockGetBankingService).toHaveBeenCalledTimes(1);
        expect(mockRejectBankingService).toHaveBeenCalledTimes(1);
        expect(mockForwardBankingService).toHaveBeenCalledTimes(0);
        expect(mockForwardAdminBankingService).toHaveBeenCalledTimes(0);
      });

      it('TC0002 - Should handle notify register successfully when status ted forwarded', async () => {
        const data =
          await NotifyRegisterBankingTedFactory.create<NotifyRegisterBankingTedEntity>(
            NotifyRegisterBankingTedEntity.name,
            { status: NotifyRegisterBankingTedStatus.TED_FORWARDED },
          );
        const message: HandleNotifyRegisterBankingTedTopazioEventRequest = {
          transactionId: data.transactionId,
          status: data.status,
        };

        const spyCreate = jest.spyOn(
          notifyRegisterBankingTedRepository,
          'create',
        );
        const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
          BankingTedEntity.name,
        );
        mockGetBankingService.mockResolvedValue(bankingTed);

        await controller.handleNotifyRegisterBankingTedTopazioEventViaBanking(
          message,
          logger,
          notifyRegisterBankingTedRepository,
          bankingService,
          adminBankingService,
          ctx,
        );

        expect(spyCreate).toHaveBeenCalledTimes(1);
        expect(mockGetBankingService).toHaveBeenCalledTimes(1);
        expect(mockRejectBankingService).toHaveBeenCalledTimes(0);
        expect(mockForwardBankingService).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
