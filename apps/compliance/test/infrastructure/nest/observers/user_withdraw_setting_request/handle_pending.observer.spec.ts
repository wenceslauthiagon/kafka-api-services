import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker/locale/pt_BR';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import {
  UserWithdrawSettingRequestRepository,
  UserWithdrawSettingRequestState,
} from '@zro/compliance/domain';
import { UserEntity } from '@zro/users/domain';
import { TransactionTypeEntity, WalletEntity } from '@zro/operations/domain';
import {
  OperationService,
  UserService,
  UserWithdrawSettingRequestGateway,
  UserWithdrawSettingRequestNotFoundException,
} from '@zro/compliance/application';
import {
  HandleUserWithdrawSettingRequestPendingRequest,
  UserWithdrawSettingRequestEventEmitterControllerInterface,
  UserWithdrawSettingRequestEventType,
} from '@zro/compliance/interface';
import { AppModule } from '@zro/compliance/infrastructure/nest/modules/app.module';
import {
  HandleUserWithdrawSettingRequestPendingNestObserver as Observer,
  UserWithdrawSettingRequestDatabaseRepository,
  UserWithdrawSettingRequestModel,
} from '@zro/compliance/infrastructure';
import { UserWithdrawSettingRequestFactory } from '@zro/test/compliance/config';

describe('HandleUserWithdrawSettingRequestPendingNestObserver', () => {
  let module: TestingModule;
  let observer: Observer;
  let userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository;

  const eventEmitter: UserWithdrawSettingRequestEventEmitterControllerInterface =
    createMock<UserWithdrawSettingRequestEventEmitterControllerInterface>();
  const mockEmitUserWithdrawSettingRequestEvent: jest.Mock = On(
    eventEmitter,
  ).get(method((mock) => mock.emitUserWithdrawSettingRequestEvent));

  const userWithdrawSettingRequestGateway: UserWithdrawSettingRequestGateway =
    createMock<UserWithdrawSettingRequestGateway>();
  const mockCreateUserWithdrawSettingRequestGateway: jest.Mock = On(
    userWithdrawSettingRequestGateway,
  ).get(method((mock) => mock.create));

  const userService: UserService = createMock<UserService>();
  const mockGetUserByUuidService: jest.Mock = On(userService).get(
    method((mock) => mock.getByUuid),
  );

  const operationService: OperationService = createMock<OperationService>();
  const mockGetWalletByUuidService: jest.Mock = On(operationService).get(
    method((mock) => mock.getWalletByUuid),
  );
  const mockGetTransactionTypeByTagService: jest.Mock = On(
    operationService,
  ).get(method((mock) => mock.getTransactionTypeByTag));

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    observer = module.get<Observer>(Observer);
    userWithdrawSettingRequestRepository =
      new UserWithdrawSettingRequestDatabaseRepository();
  });
  beforeEach(() => jest.resetAllMocks());

  describe('HandleUserWithdrawSettingRequestPendingNestObserver', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not handle if missing params', async () => {
        const message: HandleUserWithdrawSettingRequestPendingRequest = {
          id: null,
        };

        const testScript = () =>
          observer.execute(
            message,
            userWithdrawSettingRequestRepository,
            userWithdrawSettingRequestGateway,
            eventEmitter,
            userService,
            operationService,
            logger,
          );

        expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockEmitUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
          0,
        );
        expect(
          mockCreateUserWithdrawSettingRequestGateway,
        ).toHaveBeenCalledTimes(0);
        expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
        expect(mockGetWalletByUuidService).toHaveBeenCalledTimes(0);
        expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(0);
      });

      it('TC0002 - Should not handle if not found', async () => {
        const message: HandleUserWithdrawSettingRequestPendingRequest = {
          id: faker.datatype.uuid(),
        };

        const testScript = () =>
          observer.execute(
            message,
            userWithdrawSettingRequestRepository,
            userWithdrawSettingRequestGateway,
            eventEmitter,
            userService,
            operationService,
            logger,
          );

        expect(testScript).rejects.toThrow(
          UserWithdrawSettingRequestNotFoundException,
        );
        expect(mockEmitUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
          0,
        );
        expect(
          mockCreateUserWithdrawSettingRequestGateway,
        ).toHaveBeenCalledTimes(0);
        expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
        expect(mockGetWalletByUuidService).toHaveBeenCalledTimes(0);
        expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should not handle if is not pending', async () => {
        const userWithdrawSettingRequest =
          await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestModel>(
            UserWithdrawSettingRequestModel.name,
            { state: UserWithdrawSettingRequestState.OPEN },
          );

        const message: HandleUserWithdrawSettingRequestPendingRequest = {
          id: userWithdrawSettingRequest.id,
        };

        await observer.execute(
          message,
          userWithdrawSettingRequestRepository,
          userWithdrawSettingRequestGateway,
          eventEmitter,
          userService,
          operationService,
          logger,
        );

        expect(mockEmitUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
          0,
        );
        expect(
          mockCreateUserWithdrawSettingRequestGateway,
        ).toHaveBeenCalledTimes(0);
        expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
        expect(mockGetWalletByUuidService).toHaveBeenCalledTimes(0);
        expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(0);
      });

      it('TC0004 - Should set state to failed if something wrong occur', async () => {
        const userWithdrawSettingRequest =
          await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestModel>(
            UserWithdrawSettingRequestModel.name,
            { state: UserWithdrawSettingRequestState.PENDING },
          );

        const message: HandleUserWithdrawSettingRequestPendingRequest = {
          id: userWithdrawSettingRequest.id,
        };

        mockGetUserByUuidService.mockRejectedValue(null);

        await observer.execute(
          message,
          userWithdrawSettingRequestRepository,
          userWithdrawSettingRequestGateway,
          eventEmitter,
          userService,
          operationService,
          logger,
        );

        expect(mockEmitUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
          1,
        );
        expect(mockEmitUserWithdrawSettingRequestEvent.mock.calls[0][0]).toBe(
          UserWithdrawSettingRequestEventType.FAILED,
        );
        expect(
          mockCreateUserWithdrawSettingRequestGateway,
        ).toHaveBeenCalledTimes(0);
        expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
        expect(mockGetUserByUuidService).toHaveBeenCalledWith(
          userWithdrawSettingRequest.userId,
        );
        expect(mockGetWalletByUuidService).toHaveBeenCalledTimes(0);
        expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(0);
      });
    });

    describe('With valid parameters', () => {
      it('TC0005 - Should handle successfully', async () => {
        const userWithdrawSettingRequest =
          await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestModel>(
            UserWithdrawSettingRequestModel.name,
            { state: UserWithdrawSettingRequestState.PENDING },
          );

        const message: HandleUserWithdrawSettingRequestPendingRequest = {
          id: userWithdrawSettingRequest.id,
        };

        mockGetUserByUuidService.mockResolvedValue(
          new UserEntity({ uuid: userWithdrawSettingRequest.userId }),
        );
        mockGetWalletByUuidService.mockResolvedValue(
          new WalletEntity({ uuid: userWithdrawSettingRequest.walletId }),
        );
        mockGetTransactionTypeByTagService.mockResolvedValue(
          new TransactionTypeEntity({
            tag: userWithdrawSettingRequest.transactionTypeTag,
          }),
        );
        mockCreateUserWithdrawSettingRequestGateway.mockResolvedValue({
          issueId: faker.datatype.uuid(),
          key: faker.datatype.string(),
        });

        await observer.execute(
          message,
          userWithdrawSettingRequestRepository,
          userWithdrawSettingRequestGateway,
          eventEmitter,
          userService,
          operationService,
          logger,
        );

        expect(mockEmitUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
          1,
        );
        expect(mockEmitUserWithdrawSettingRequestEvent.mock.calls[0][0]).toBe(
          UserWithdrawSettingRequestEventType.OPEN,
        );
        expect(
          mockCreateUserWithdrawSettingRequestGateway,
        ).toHaveBeenCalledTimes(1);
        expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
        expect(mockGetUserByUuidService).toHaveBeenCalledWith(
          userWithdrawSettingRequest.userId,
        );
        expect(mockGetWalletByUuidService).toHaveBeenCalledTimes(1);
        expect(mockGetWalletByUuidService).toHaveBeenCalledWith(
          userWithdrawSettingRequest.walletId,
        );
        expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(1);
        expect(mockGetTransactionTypeByTagService).toHaveBeenCalledWith(
          userWithdrawSettingRequest.transactionTypeTag,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
