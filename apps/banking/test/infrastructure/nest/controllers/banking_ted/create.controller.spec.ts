import * as moment from 'moment';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger, ForbiddenException } from '@zro/common';
import * as utilIsHourInRange from '@zro/common/utils/is_hour_in_range.util';
import { UserEntity } from '@zro/users/domain';
import { OperationEntity, WalletEntity } from '@zro/operations/domain';
import { BankingTedEntity, BankingTedState } from '@zro/banking/domain';
import {
  BankingTedEventEmitterControllerInterface,
  CreateBankingTedRequest,
} from '@zro/banking/interface';
import {
  CreateBankingTedMicroserviceController as Controller,
  BankingTedDatabaseRepository,
  UserServiceKafka,
  BankTedDatabaseRepository,
  QuotationServiceKafka,
  BankTedModel,
  BankingTedModel,
} from '@zro/banking/infrastructure';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import { BankingTedFactory, BankTedFactory } from '@zro/test/banking/config';
import { OperationFactory, WalletFactory } from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';

describe('CreateBankingTedMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let bankingTedRepository: BankingTedDatabaseRepository;
  let bankTedRepository: BankTedDatabaseRepository;

  const mockIsHourInRange = jest.spyOn(utilIsHourInRange, 'isHourInRange');
  const mockMomentUtc = jest.spyOn(moment, 'utc');

  const bankingTedEmitter: BankingTedEventEmitterControllerInterface =
    createMock<BankingTedEventEmitterControllerInterface>();
  const mockEmitBankingTedStaticEvent: jest.Mock = On(bankingTedEmitter).get(
    method((mock) => mock.emitBankingTedEvent),
  );

  const userService: UserServiceKafka = createMock<UserServiceKafka>();
  const mockGetOnboardingService: jest.Mock = On(userService).get(
    method((mock) => mock.getOnboardingByUserAndStatusIsFinished),
  );
  const mockGetUserService: jest.Mock = On(userService).get(
    method((mock) => mock.getUserByUuid),
  );

  const quotationService: QuotationServiceKafka =
    createMock<QuotationServiceKafka>();
  const mockGetHolidayByDateService: jest.Mock = On(quotationService).get(
    method((mock) => mock.getHolidayByDate),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    bankingTedRepository = new BankingTedDatabaseRepository();
    bankTedRepository = new BankTedDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CreateBankingTed', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create pending successfully', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);
        const operation = await OperationFactory.create<OperationEntity>(
          OperationEntity.name,
        );
        const bankTed = await BankTedFactory.create<BankTedModel>(
          BankTedModel.name,
          { code: '237' },
        );
        const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
          BankingTedEntity.name,
          { user, beneficiaryBankCode: bankTed.code },
        );
        const wallet = await WalletFactory.create<WalletEntity>(
          WalletEntity.name,
        );

        mockGetOnboardingService.mockResolvedValue({});
        mockGetUserService.mockResolvedValue(user);
        mockGetHolidayByDateService.mockResolvedValue(null);
        mockIsHourInRange.mockImplementation(() => true);
        mockMomentUtc.mockImplementation(() => moment().day(1).hour(12));

        const {
          amount,
          beneficiaryBankCode,
          beneficiaryName,
          beneficiaryType,
          beneficiaryDocument,
          beneficiaryAgency,
          beneficiaryAccount,
          beneficiaryAccountDigit,
          beneficiaryAccountType,
        } = bankingTed;

        const message: CreateBankingTedRequest = {
          userId: user.uuid,
          walletId: wallet.uuid,
          operationId: operation.id,
          amount,
          beneficiaryBankCode,
          beneficiaryName,
          beneficiaryType,
          beneficiaryDocument,
          beneficiaryAgency,
          beneficiaryAccount,
          beneficiaryAccountDigit,
          beneficiaryAccountType,
        };

        const result = await controller.execute(
          bankingTedRepository,
          bankTedRepository,
          bankingTedEmitter,
          userService,
          quotationService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.operationId).toBeDefined();
        expect(result.value.createdAt).toBeDefined();
        expect(mockEmitBankingTedStaticEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitBankingTedStaticEvent.mock.calls[0][0]).toBe(
          BankingTedState.PENDING,
        );
      });

      describe('With invalid parameters', () => {
        it("TC0002 - should don't create bankingTed when user is forbidden", async () => {
          const user = await UserFactory.create<UserEntity>(UserEntity.name);
          const operation = await OperationFactory.create<OperationEntity>(
            OperationEntity.name,
          );
          const bankTed = await BankTedFactory.create<BankTedModel>(
            BankTedModel.name,
            { code: '237' },
          );
          const bankingTed = await BankingTedFactory.create<BankingTedModel>(
            BankingTedModel.name,
            { beneficiaryBankCode: bankTed.code, operationId: operation.id },
          );
          const wallet = await WalletFactory.create<WalletEntity>(
            WalletEntity.name,
          );

          const {
            amount,
            beneficiaryBankCode,
            beneficiaryName,
            beneficiaryType,
            beneficiaryDocument,
            beneficiaryAgency,
            beneficiaryAccount,
            beneficiaryAccountDigit,
            beneficiaryAccountType,
          } = bankingTed;

          const message: CreateBankingTedRequest = {
            userId: user.uuid,
            walletId: wallet.uuid,
            operationId: operation.id,
            amount,
            beneficiaryBankCode,
            beneficiaryName,
            beneficiaryType,
            beneficiaryDocument,
            beneficiaryAgency,
            beneficiaryAccount,
            beneficiaryAccountDigit,
            beneficiaryAccountType,
          };

          const testScript = () =>
            controller.execute(
              bankingTedRepository,
              bankTedRepository,
              bankingTedEmitter,
              userService,
              quotationService,
              logger,
              message,
              ctx,
            );

          await expect(testScript).rejects.toThrow(ForbiddenException);
          expect(mockEmitBankingTedStaticEvent).toHaveBeenCalledTimes(0);
        });
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
