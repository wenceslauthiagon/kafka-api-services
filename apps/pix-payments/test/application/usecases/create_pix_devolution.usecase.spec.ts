import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import {
  MissingDataException,
  defaultLogger as logger,
  ForbiddenException,
  getMoment,
} from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { OperationEntity, WalletEntity } from '@zro/operations/domain';
import {
  PixDepositRepository,
  PixDevolutionRepository,
  PixDevolutionState,
  PixDevolutionCode,
} from '@zro/pix-payments/domain';
import {
  CreatePixDevolutionUseCase as UseCase,
  PixDepositNotFoundException,
  PixDevolutionEventEmitter,
  PixDevolutionAmountOverflowException,
  PixDevolutionMaxNumberException,
  PixDepositExpiredDevolutionTimeException,
} from '@zro/pix-payments/application';
import {
  PixDepositDatabaseRepository,
  PixDepositModel,
  PixDevolutionDatabaseRepository,
  PixDevolutionModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  PixDevolutionFactory,
  PixDepositFactory,
} from '@zro/test/pix-payments/config';

describe('CreatePixDevolutionUseCase', () => {
  let module: TestingModule;
  let devolutionRepository: PixDevolutionRepository;
  let depositRepository: PixDepositRepository;

  const DEVOLUTION_LIMIT = 0;
  const DEVOLUTION_INTERVAL_DAY = 1;
  const APP_OPERATION_WITHDRAWAL_QRS_TRANSACTION_TAG = 'PIXSEND';
  const APP_OPERATION_WITHDRAWAL_QRD_TRANSACTION_TAG = 'PIXSEND';
  const APP_OPERATION_CHANGE_QRD_TRANSACTION_TAG = 'PIXCHANGE';

  const eventEmitter: PixDevolutionEventEmitter =
    createMock<PixDevolutionEventEmitter>();
  const mockPendingEventEmitter: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.pendingDevolution),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    devolutionRepository = new PixDevolutionDatabaseRepository();
    depositRepository = new PixDepositDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create with invalid amount', async () => {
      const user = new UserEntity({ uuid: faker.datatype.uuid() });
      const operation = new OperationEntity({ id: faker.datatype.uuid() });

      const usecase = new UseCase(
        logger,
        devolutionRepository,
        depositRepository,
        eventEmitter,
        DEVOLUTION_LIMIT,
        DEVOLUTION_INTERVAL_DAY,
        APP_OPERATION_WITHDRAWAL_QRS_TRANSACTION_TAG,
        APP_OPERATION_WITHDRAWAL_QRD_TRANSACTION_TAG,
        APP_OPERATION_CHANGE_QRD_TRANSACTION_TAG,
      );

      const id = faker.datatype.uuid();
      const testScript = () => usecase.execute(id, user, null, operation, 0);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - should get a devolution successfully if one already exists', async () => {
      const devolution = await PixDevolutionFactory.create<PixDevolutionModel>(
        PixDevolutionModel.name,
        { createdAt: new Date() },
      );
      const user = new UserEntity({ uuid: devolution.userId });
      const wallet = new WalletEntity({ uuid: devolution.walletId });
      const operation = new OperationEntity({ id: devolution.operationId });

      const usecase = new UseCase(
        logger,
        devolutionRepository,
        depositRepository,
        eventEmitter,
        DEVOLUTION_LIMIT,
        DEVOLUTION_INTERVAL_DAY,
        APP_OPERATION_WITHDRAWAL_QRS_TRANSACTION_TAG,
        APP_OPERATION_WITHDRAWAL_QRD_TRANSACTION_TAG,
        APP_OPERATION_CHANGE_QRD_TRANSACTION_TAG,
      );

      const result = await usecase.execute(
        devolution.id,
        user,
        wallet,
        operation,
        devolution.amount,
      );

      expect(result).toBeDefined();
      expect(result).toMatchObject(devolution.toDomain());
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not create the devolution if another user has this devolution id', async () => {
      const { id } = await PixDevolutionFactory.create<PixDevolutionModel>(
        PixDevolutionModel.name,
        { createdAt: new Date() },
      );
      const user = new UserEntity({ uuid: faker.datatype.uuid() });
      const wallet = new WalletEntity({ uuid: faker.datatype.uuid() });
      const operation = new OperationEntity({ id: faker.datatype.uuid() });

      const usecase = new UseCase(
        logger,
        devolutionRepository,
        depositRepository,
        eventEmitter,
        DEVOLUTION_LIMIT,
        DEVOLUTION_INTERVAL_DAY,
        APP_OPERATION_WITHDRAWAL_QRS_TRANSACTION_TAG,
        APP_OPERATION_WITHDRAWAL_QRD_TRANSACTION_TAG,
        APP_OPERATION_CHANGE_QRD_TRANSACTION_TAG,
      );

      const testScript = () => usecase.execute(id, user, wallet, operation, 1);

      await expect(testScript).rejects.toThrow(ForbiddenException);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not create if operation id is not found', async () => {
      const user = new UserEntity({ uuid: faker.datatype.uuid() });
      const wallet = new WalletEntity({ uuid: faker.datatype.uuid() });
      const operation = new OperationEntity({ id: faker.datatype.uuid() });

      const usecase = new UseCase(
        logger,
        devolutionRepository,
        depositRepository,
        eventEmitter,
        DEVOLUTION_LIMIT,
        DEVOLUTION_INTERVAL_DAY,
        APP_OPERATION_WITHDRAWAL_QRS_TRANSACTION_TAG,
        APP_OPERATION_WITHDRAWAL_QRD_TRANSACTION_TAG,
        APP_OPERATION_CHANGE_QRD_TRANSACTION_TAG,
      );

      const id = faker.datatype.uuid();
      const testScript = () => usecase.execute(id, user, wallet, operation, 1);

      await expect(testScript).rejects.toThrow(PixDepositNotFoundException);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not create if amount is greater than deposit amount', async () => {
      const deposit = await PixDepositFactory.create<PixDepositModel>(
        PixDepositModel.name,
        { createdAt: new Date() },
      );
      const user = new UserEntity({ uuid: deposit.userId });
      const wallet = new WalletEntity({ uuid: deposit.walletId });
      const operation = new OperationEntity({ id: deposit.operationId });

      const usecase = new UseCase(
        logger,
        devolutionRepository,
        depositRepository,
        eventEmitter,
        DEVOLUTION_LIMIT,
        DEVOLUTION_INTERVAL_DAY,
        APP_OPERATION_WITHDRAWAL_QRS_TRANSACTION_TAG,
        APP_OPERATION_WITHDRAWAL_QRD_TRANSACTION_TAG,
        APP_OPERATION_CHANGE_QRD_TRANSACTION_TAG,
      );

      const id = faker.datatype.uuid();
      const testScript = () =>
        usecase.execute(id, user, wallet, operation, deposit.amount + 1);

      await expect(testScript).rejects.toThrow(
        PixDevolutionAmountOverflowException,
      );
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not create if total amount is greater than deposit amount', async () => {
      const deposit = await PixDepositFactory.create<PixDepositModel>(
        PixDepositModel.name,
        { createdAt: new Date(), amount: 1000, returnedAmount: 1000 },
      );
      const user = new UserEntity({ uuid: deposit.userId });
      const wallet = new WalletEntity({ uuid: deposit.walletId });
      const operation = new OperationEntity({ id: deposit.operationId });

      const usecase = new UseCase(
        logger,
        devolutionRepository,
        depositRepository,
        eventEmitter,
        DEVOLUTION_LIMIT,
        DEVOLUTION_INTERVAL_DAY,
        APP_OPERATION_WITHDRAWAL_QRS_TRANSACTION_TAG,
        APP_OPERATION_WITHDRAWAL_QRD_TRANSACTION_TAG,
        APP_OPERATION_CHANGE_QRD_TRANSACTION_TAG,
      );

      const id = faker.datatype.uuid();
      const testScript = () => usecase.execute(id, user, wallet, operation, 1);

      await expect(testScript).rejects.toThrow(
        PixDevolutionAmountOverflowException,
      );
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should not create if it exceeds the devolution max number', async () => {
      const deposit = await PixDepositFactory.create<PixDepositModel>(
        PixDepositModel.name,
        { createdAt: new Date() },
      );
      await PixDevolutionFactory.create<PixDevolutionModel>(
        PixDevolutionModel.name,
        {
          amount: deposit.amount - 1,
          depositId: deposit.id,
          operationId: deposit.operationId,
          userId: deposit.userId,
        },
      );
      const user = new UserEntity({ uuid: deposit.userId });
      const wallet = new WalletEntity({ uuid: deposit.walletId });
      const operation = new OperationEntity({ id: deposit.operationId });

      const usecase = new UseCase(
        logger,
        devolutionRepository,
        depositRepository,
        eventEmitter,
        1,
        DEVOLUTION_INTERVAL_DAY,
        APP_OPERATION_WITHDRAWAL_QRS_TRANSACTION_TAG,
        APP_OPERATION_WITHDRAWAL_QRD_TRANSACTION_TAG,
        APP_OPERATION_CHANGE_QRD_TRANSACTION_TAG,
      );

      const id = faker.datatype.uuid();
      const testScript = () => usecase.execute(id, user, wallet, operation, 1);

      await expect(testScript).rejects.toThrow(PixDevolutionMaxNumberException);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0008 - Should not create if it exceeds the devolution interval days', async () => {
      const intervalDays = faker.datatype.number({ min: 1, max: 99 });
      const deposit = await PixDepositFactory.create<PixDepositModel>(
        PixDepositModel.name,
        { createdAt: getMoment().subtract(intervalDays, 'day').toDate() },
      );
      const devolution = await PixDevolutionFactory.create<PixDevolutionModel>(
        PixDevolutionModel.name,
        { operationId: deposit.operationId, userId: deposit.userId },
      );

      const usecase = new UseCase(
        logger,
        devolutionRepository,
        depositRepository,
        eventEmitter,
        faker.datatype.number({ min: 1, max: 99 }),
        intervalDays,
        APP_OPERATION_WITHDRAWAL_QRS_TRANSACTION_TAG,
        APP_OPERATION_WITHDRAWAL_QRD_TRANSACTION_TAG,
        APP_OPERATION_CHANGE_QRD_TRANSACTION_TAG,
      );

      const testScript = () =>
        usecase.execute(
          faker.datatype.uuid(),
          new UserEntity({ uuid: devolution.userId }),
          new WalletEntity({ uuid: deposit.walletId }),
          new OperationEntity({ id: devolution.operationId }),
          devolution.amount,
        );

      await expect(testScript).rejects.toThrow(
        PixDepositExpiredDevolutionTimeException,
      );
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0009 - Should create devolution successfully', async () => {
      const deposit = await PixDepositFactory.create<PixDepositModel>(
        PixDepositModel.name,
        { createdAt: new Date() },
      );
      const user = new UserEntity({ uuid: deposit.userId });
      const wallet = new WalletEntity({ uuid: deposit.walletId });
      const operation = new OperationEntity({ id: deposit.operationId });

      const usecase = new UseCase(
        logger,
        devolutionRepository,
        depositRepository,
        eventEmitter,
        DEVOLUTION_LIMIT,
        DEVOLUTION_INTERVAL_DAY,
        APP_OPERATION_WITHDRAWAL_QRS_TRANSACTION_TAG,
        APP_OPERATION_WITHDRAWAL_QRD_TRANSACTION_TAG,
        APP_OPERATION_CHANGE_QRD_TRANSACTION_TAG,
      );

      const id = faker.datatype.uuid();
      const result = await usecase.execute(
        id,
        user,
        wallet,
        operation,
        deposit.amount,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.amount).toBe(deposit.amount);
      expect(result.user.id).toBe(user.id);
      expect(result.state).toBe(PixDevolutionState.PENDING);
      expect(result.createdAt).toBeDefined();
      expect(result.deposit.id).toBe(deposit.id);
      expect(result.devolutionCode).toBe(PixDevolutionCode.ORIGINAL);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(1);
    });

    it('TC0010 - Should create devolution with another devolution', async () => {
      const deposit = await PixDepositFactory.create<PixDepositModel>(
        PixDepositModel.name,
        { createdAt: new Date(), amount: 1000, returnedAmount: 999 },
      );
      const user = new UserEntity({ uuid: deposit.userId });
      const wallet = new WalletEntity({ uuid: deposit.walletId });
      const operation = new OperationEntity({ id: deposit.operationId });

      const usecase = new UseCase(
        logger,
        devolutionRepository,
        depositRepository,
        eventEmitter,
        DEVOLUTION_LIMIT,
        DEVOLUTION_INTERVAL_DAY,
        APP_OPERATION_WITHDRAWAL_QRS_TRANSACTION_TAG,
        APP_OPERATION_WITHDRAWAL_QRD_TRANSACTION_TAG,
        APP_OPERATION_CHANGE_QRD_TRANSACTION_TAG,
      );

      const id = faker.datatype.uuid();
      const result = await usecase.execute(id, user, wallet, operation, 1);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.amount).toBe(1);
      expect(result.user.id).toBe(user.id);
      expect(result.state).toBe(PixDevolutionState.PENDING);
      expect(result.createdAt).toBeDefined();
      expect(result.deposit.id).toBe(deposit.id);
      expect(result.devolutionCode).toBe(PixDevolutionCode.ORIGINAL);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(1);
    });

    it('TC0011 - Should create devolution with WITHDRAWAL_CHANGE RTReason', async () => {
      const deposit = await PixDepositFactory.create<PixDepositModel>(
        PixDepositModel.name,
        {
          createdAt: new Date(),
          amount: 1000,
          returnedAmount: 999,
          transactionTag: 'PIXSEND',
        },
      );

      const user = new UserEntity({ uuid: deposit.userId });
      const wallet = new WalletEntity({ uuid: deposit.walletId });
      const operation = new OperationEntity({ id: deposit.operationId });

      const usecase = new UseCase(
        logger,
        devolutionRepository,
        depositRepository,
        eventEmitter,
        DEVOLUTION_LIMIT,
        DEVOLUTION_INTERVAL_DAY,
        APP_OPERATION_WITHDRAWAL_QRS_TRANSACTION_TAG,
        APP_OPERATION_WITHDRAWAL_QRD_TRANSACTION_TAG,
        APP_OPERATION_CHANGE_QRD_TRANSACTION_TAG,
      );

      const id = faker.datatype.uuid();
      const result = await usecase.execute(id, user, wallet, operation, 1);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.amount).toBe(1);
      expect(result.user.id).toBe(user.id);
      expect(result.state).toBe(PixDevolutionState.PENDING);
      expect(result.createdAt).toBeDefined();
      expect(result.deposit.id).toBe(deposit.id);
      expect(result.devolutionCode).toBe(PixDevolutionCode.WITHDRAWAL_CHANGE);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(1);
    });

    it('TC0012 - Should create devolution with WITHDRAWAL_CHANGE RTReason', async () => {
      const deposit = await PixDepositFactory.create<PixDepositModel>(
        PixDepositModel.name,
        {
          createdAt: new Date(),
          amount: 1000,
          returnedAmount: 999,
          transactionTag: 'PIXCHANGE',
        },
      );

      const user = new UserEntity({ uuid: deposit.userId });
      const wallet = new WalletEntity({ uuid: deposit.walletId });
      const operation = new OperationEntity({ id: deposit.operationId });

      const usecase = new UseCase(
        logger,
        devolutionRepository,
        depositRepository,
        eventEmitter,
        DEVOLUTION_LIMIT,
        DEVOLUTION_INTERVAL_DAY,
        APP_OPERATION_WITHDRAWAL_QRS_TRANSACTION_TAG,
        APP_OPERATION_WITHDRAWAL_QRD_TRANSACTION_TAG,
        APP_OPERATION_CHANGE_QRD_TRANSACTION_TAG,
      );

      const id = faker.datatype.uuid();
      const result = await usecase.execute(id, user, wallet, operation, 1);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.amount).toBe(1);
      expect(result.user.id).toBe(user.id);
      expect(result.state).toBe(PixDevolutionState.PENDING);
      expect(result.createdAt).toBeDefined();
      expect(result.deposit.id).toBe(deposit.id);
      expect(result.devolutionCode).toBe(PixDevolutionCode.WITHDRAWAL_CHANGE);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(1);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
