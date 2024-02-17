import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import {
  UserWithdrawSettingRequestEntity,
  UserWithdrawSettingRequestRepository,
  WithdrawSettingType,
  WithdrawSettingWeekDays,
} from '@zro/compliance/domain';
import {
  OperationService,
  PixKeyService,
  UtilService,
} from '@zro/compliance/application';
import {
  CreateApproveUserWithdrawSettingRequest,
  UserWithdrawSettingRequestEventEmitterControllerInterface,
} from '@zro/compliance/interface';
import {
  CreateApproveUserWithdrawSettingRequestMicroserviceController as Controller,
  UserWithdrawSettingRequestDatabaseRepository,
} from '@zro/compliance/infrastructure';
import { AppModule } from '@zro/compliance/infrastructure/nest/modules/app.module';
import { UserWithdrawSettingRequestFactory } from '@zro/test/compliance/config';

describe('CreateApproveUserWithdrawSettingRequestMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository;

  const eventEmitterController: UserWithdrawSettingRequestEventEmitterControllerInterface =
    createMock<UserWithdrawSettingRequestEventEmitterControllerInterface>();

  const operationService: OperationService = createMock<OperationService>();
  const mockGetTransactionTypeByTagService: jest.Mock = On(
    operationService,
  ).get(method((mock) => mock.getTransactionTypeByTag));
  const mockGetUserWalletByUserAndWalletService: jest.Mock = On(
    operationService,
  ).get(method((mock) => mock.getUserWalletByUserAndWallet));

  const pixKeyService: PixKeyService = createMock<PixKeyService>();
  const mockCreateDecodedPixKeyService: jest.Mock = On(pixKeyService).get(
    method((mock) => mock.createDecoded),
  );
  const utilService: UtilService = createMock<UtilService>();
  const mockGetAllByWalletUserWithdrawSettingService: jest.Mock = On(
    utilService,
  ).get(method((mock) => mock.getAllByWalletUserWithdrawSetting));

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    userWithdrawSettingRequestRepository =
      new UserWithdrawSettingRequestDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CreateApproveUserWithdrawSettingRequest', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not create if mising params', async () => {
        const message: CreateApproveUserWithdrawSettingRequest = {
          id: null,
          type: null,
          balance: null,
          day: null,
          weekDay: null,
          userId: null,
          walletId: null,
          transactionTypeTag: null,
          pixKey: null,
          pixKeyType: null,
        };

        const test = () =>
          controller.execute(
            userWithdrawSettingRequestRepository,
            eventEmitterController,
            operationService,
            pixKeyService,
            utilService,
            logger,
            message,
            ctx,
          );

        await expect(test).rejects.toThrow(InvalidDataFormatException);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should create daily type successfully', async () => {
        const userWithdrawSettingRequest =
          await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
            UserWithdrawSettingRequestEntity.name,
            { type: WithdrawSettingType.DAILY },
          );

        mockGetAllByWalletUserWithdrawSettingService.mockResolvedValue([]);
        mockGetTransactionTypeByTagService.mockResolvedValue(
          userWithdrawSettingRequest.transactionType,
        );
        mockGetUserWalletByUserAndWalletService.mockResolvedValue(
          userWithdrawSettingRequest.wallet,
        );

        const message: CreateApproveUserWithdrawSettingRequest = {
          id: userWithdrawSettingRequest.id,
          type: userWithdrawSettingRequest.type,
          balance: userWithdrawSettingRequest.balance,
          day: null,
          weekDay: null,
          userId: userWithdrawSettingRequest.user.uuid,
          walletId: userWithdrawSettingRequest.wallet.uuid,
          transactionTypeTag: userWithdrawSettingRequest.transactionType.tag,
          pixKey: userWithdrawSettingRequest.pixKey.key,
          pixKeyType: userWithdrawSettingRequest.pixKey.type,
        };

        const result = await controller.execute(
          userWithdrawSettingRequestRepository,
          eventEmitterController,
          operationService,
          pixKeyService,
          utilService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value.id).toBe(userWithdrawSettingRequest.id);
        expect(result.value.type).toBe(userWithdrawSettingRequest.type);
        expect(result.value.balance).toBe(userWithdrawSettingRequest.balance);
      });

      it('TC0003 - Should create weekly type successfully', async () => {
        const userWithdrawSettingRequest =
          await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
            UserWithdrawSettingRequestEntity.name,
            {
              type: WithdrawSettingType.WEEKLY,
              weekDay: WithdrawSettingWeekDays.MONDAY,
            },
          );

        mockGetAllByWalletUserWithdrawSettingService.mockResolvedValue([]);
        mockGetTransactionTypeByTagService.mockResolvedValue(
          userWithdrawSettingRequest.transactionType,
        );
        mockGetUserWalletByUserAndWalletService.mockResolvedValue(
          userWithdrawSettingRequest.wallet,
        );

        const message: CreateApproveUserWithdrawSettingRequest = {
          id: userWithdrawSettingRequest.id,
          type: userWithdrawSettingRequest.type,
          balance: userWithdrawSettingRequest.balance,
          day: null,
          weekDay: userWithdrawSettingRequest.weekDay,
          userId: userWithdrawSettingRequest.user.uuid,
          walletId: userWithdrawSettingRequest.wallet.uuid,
          transactionTypeTag: userWithdrawSettingRequest.transactionType.tag,
          pixKey: userWithdrawSettingRequest.pixKey.key,
          pixKeyType: userWithdrawSettingRequest.pixKey.type,
        };

        const result = await controller.execute(
          userWithdrawSettingRequestRepository,
          eventEmitterController,
          operationService,
          pixKeyService,
          utilService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value.id).toBe(userWithdrawSettingRequest.id);
        expect(result.value.type).toBe(userWithdrawSettingRequest.type);
        expect(result.value.balance).toBe(userWithdrawSettingRequest.balance);
        expect(result.value.weekDay).toBe(userWithdrawSettingRequest.weekDay);
      });

      it('TC0004 - Should create monthly type successfully', async () => {
        const userWithdrawSettingRequest =
          await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
            UserWithdrawSettingRequestEntity.name,
            { type: WithdrawSettingType.MONTHLY, day: 5 },
          );

        mockGetAllByWalletUserWithdrawSettingService.mockResolvedValue([]);
        mockGetTransactionTypeByTagService.mockResolvedValue(
          userWithdrawSettingRequest.transactionType,
        );
        mockGetUserWalletByUserAndWalletService.mockResolvedValue(
          userWithdrawSettingRequest.wallet,
        );

        const message: CreateApproveUserWithdrawSettingRequest = {
          id: userWithdrawSettingRequest.id,
          type: userWithdrawSettingRequest.type,
          balance: userWithdrawSettingRequest.balance,
          day: userWithdrawSettingRequest.day,
          weekDay: null,
          userId: userWithdrawSettingRequest.user.uuid,
          walletId: userWithdrawSettingRequest.wallet.uuid,
          transactionTypeTag: userWithdrawSettingRequest.transactionType.tag,
          pixKey: userWithdrawSettingRequest.pixKey.key,
          pixKeyType: userWithdrawSettingRequest.pixKey.type,
        };

        const result = await controller.execute(
          userWithdrawSettingRequestRepository,
          eventEmitterController,
          operationService,
          pixKeyService,
          utilService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value.id).toBe(userWithdrawSettingRequest.id);
        expect(result.value.type).toBe(userWithdrawSettingRequest.type);
        expect(result.value.balance).toBe(userWithdrawSettingRequest.balance);
        expect(result.value.day).toBe(userWithdrawSettingRequest.day);
      });

      it('TC0005 - Should create balance type successfully', async () => {
        const userWithdrawSettingRequest =
          await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
            UserWithdrawSettingRequestEntity.name,
            { type: WithdrawSettingType.BALANCE },
          );

        mockGetAllByWalletUserWithdrawSettingService.mockResolvedValue([]);
        mockGetTransactionTypeByTagService.mockResolvedValue(
          userWithdrawSettingRequest.transactionType,
        );
        mockGetUserWalletByUserAndWalletService.mockResolvedValue(
          userWithdrawSettingRequest.wallet,
        );

        const message: CreateApproveUserWithdrawSettingRequest = {
          id: userWithdrawSettingRequest.id,
          type: userWithdrawSettingRequest.type,
          balance: userWithdrawSettingRequest.balance,
          day: null,
          weekDay: null,
          userId: userWithdrawSettingRequest.user.uuid,
          walletId: userWithdrawSettingRequest.wallet.uuid,
          transactionTypeTag: userWithdrawSettingRequest.transactionType.tag,
          pixKey: userWithdrawSettingRequest.pixKey.key,
          pixKeyType: userWithdrawSettingRequest.pixKey.type,
        };

        const result = await controller.execute(
          userWithdrawSettingRequestRepository,
          eventEmitterController,
          operationService,
          pixKeyService,
          utilService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value.id).toBe(userWithdrawSettingRequest.id);
        expect(result.value.type).toBe(userWithdrawSettingRequest.type);
        expect(result.value.balance).toBe(userWithdrawSettingRequest.balance);
      });

      it('TC0006 - Should create with decoded pix key successfully', async () => {
        const userWithdrawSettingRequest =
          await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
            UserWithdrawSettingRequestEntity.name,
            { type: WithdrawSettingType.BALANCE },
          );

        mockGetAllByWalletUserWithdrawSettingService.mockResolvedValue([]);
        mockGetTransactionTypeByTagService.mockResolvedValue(
          userWithdrawSettingRequest.transactionType,
        );
        mockGetUserWalletByUserAndWalletService.mockResolvedValue(
          userWithdrawSettingRequest.wallet,
        );
        mockCreateDecodedPixKeyService.mockResolvedValue(
          userWithdrawSettingRequest.pixKey,
        );

        const message: CreateApproveUserWithdrawSettingRequest = {
          id: userWithdrawSettingRequest.id,
          type: userWithdrawSettingRequest.type,
          balance: userWithdrawSettingRequest.balance,
          day: null,
          weekDay: null,
          userId: userWithdrawSettingRequest.user.uuid,
          walletId: userWithdrawSettingRequest.wallet.uuid,
          transactionTypeTag: userWithdrawSettingRequest.transactionType.tag,
          pixKey: userWithdrawSettingRequest.pixKey.key,
          pixKeyType: userWithdrawSettingRequest.pixKey.type,
          pixKeyDocument: userWithdrawSettingRequest.pixKey.document,
        };

        const result = await controller.execute(
          userWithdrawSettingRequestRepository,
          eventEmitterController,
          operationService,
          pixKeyService,
          utilService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value.id).toBe(userWithdrawSettingRequest.id);
        expect(result.value.type).toBe(userWithdrawSettingRequest.type);
        expect(result.value.balance).toBe(userWithdrawSettingRequest.balance);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
