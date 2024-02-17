import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { PaginationEntity, defaultLogger as logger } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { BankEntity } from '@zro/banking/domain';
import { WalletEntity } from '@zro/operations/domain';
import { PaymentRepository, PaymentState } from '@zro/pix-payments/domain';
import {
  BankingService,
  GetAllPaymentUseCase as UseCase,
} from '@zro/pix-payments/application';
import {
  PaymentDatabaseRepository,
  PaymentModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PaymentFactory } from '@zro/test/pix-payments/config';
import { BankFactory } from '@zro/test/banking/config';

describe('GetAllPaymentUseCase', () => {
  let module: TestingModule;
  let paymentRepository: PaymentRepository;
  let bankingService: BankingService;
  let bankMockIspb: string;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    paymentRepository = new PaymentDatabaseRepository();

    const bankMock = await BankFactory.create<BankEntity>(BankEntity.name);
    bankMockIspb = bankMock.ispb;

    bankingService = createMock<BankingService>();
    const mockGetBankingService: jest.Mock = On(bankingService).get(
      method((mock) => mock.getBankByIspb),
    );

    mockGetBankingService.mockResolvedValue(bankMock);
  });

  describe('With valid parameters', () => {
    it('TC0001 - (As user) - Should get all payments successfully', async () => {
      const userId = uuidV4();

      await PaymentFactory.createMany<PaymentModel>(PaymentModel.name, 3, {
        userId,
      });

      const usecase = new UseCase(
        logger,
        paymentRepository,
        bankingService,
        bankMockIspb,
      );

      const pagination = new PaginationEntity();
      const user = new UserEntity({ uuid: userId });

      const result = await usecase.execute(pagination, user);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(pagination.page);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBeDefined();
      expect(result.pageTotal).toBe(
        Math.ceil(result.total / pagination.pageSize),
      );
      result.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.user.uuid).toBe(userId);
        expect(res.createdAt).toBeDefined();
      });
    });

    it('TC0002 - (As user) - Should get payments filtered by single state successfully', async () => {
      const userId = uuidV4();
      const walletId = uuidV4();

      await PaymentFactory.createMany<PaymentModel>(PaymentModel.name, 3, {
        userId,
        walletId,
        state: PaymentState.PENDING,
      });
      await PaymentFactory.createMany<PaymentModel>(PaymentModel.name, 3, {
        userId,
        walletId,
        state: PaymentState.SCHEDULED,
      });

      const usecase = new UseCase(
        logger,
        paymentRepository,
        bankingService,
        bankMockIspb,
      );

      const pagination = new PaginationEntity();
      const states = [PaymentState.SCHEDULED];
      const user = new UserEntity({ uuid: userId });
      const wallet = new WalletEntity({ uuid: walletId });

      const result = await usecase.execute(pagination, user, wallet, states);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(pagination.page);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBeDefined();
      expect(result.pageTotal).toBe(
        Math.ceil(result.total / pagination.pageSize),
      );
      result.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.user.uuid).toBe(userId);
        expect(states).toContain(res.state);
        expect(res.createdAt).toBeDefined();
      });
    });

    it('TC0003 - (As user) - Should get payments filtered by multiple states successfully', async () => {
      const walletId = uuidV4();

      await PaymentFactory.createMany<PaymentModel>(PaymentModel.name, 3, {
        walletId,
        state: PaymentState.PENDING,
      });
      await PaymentFactory.createMany<PaymentModel>(PaymentModel.name, 3, {
        walletId,
        state: PaymentState.SCHEDULED,
      });
      await PaymentFactory.createMany<PaymentModel>(PaymentModel.name, 3, {
        walletId,
        state: PaymentState.CONFIRMED,
      });

      const usecase = new UseCase(
        logger,
        paymentRepository,
        bankingService,
        bankMockIspb,
      );

      const pagination = new PaginationEntity();
      const user = null;
      const wallet = new WalletEntity({ uuid: walletId });
      const states = [PaymentState.SCHEDULED, PaymentState.CONFIRMED];

      const result = await usecase.execute(pagination, user, wallet, states);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(pagination.page);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBeDefined();
      expect(result.pageTotal).toBe(
        Math.ceil(result.total / pagination.pageSize),
      );
      result.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.wallet.uuid).toBe(walletId);
        expect(states).toContain(res.state);
        expect(res.createdAt).toBeDefined();
      });
    });

    it('TC0004 - (As user) - Should get all payments successfully with date filter', async () => {
      const userId = uuidV4();
      const walletId = uuidV4();

      await PaymentFactory.createMany<PaymentModel>(PaymentModel.name, 3, {
        userId,
        walletId,
        paymentDate: null,
      });

      const usecase = new UseCase(
        logger,
        paymentRepository,
        bankingService,
        bankMockIspb,
      );

      const pagination = new PaginationEntity();
      const user = new UserEntity({ uuid: userId });
      const wallet = new WalletEntity({ uuid: walletId });

      const result = await usecase.execute(pagination, user, wallet);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(pagination.page);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBeDefined();
      expect(result.pageTotal).toBe(
        Math.ceil(result.total / pagination.pageSize),
      );
      result.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.user.uuid).toBe(userId);
        expect(res.createdAt).toBeDefined();
      });
    });

    it('TC0005 - (As admin) - Should get all payments successfully', async () => {
      const userId = uuidV4();
      const secondUserId = uuidV4();

      await PaymentFactory.createMany<PaymentModel>(PaymentModel.name, 3, {
        userId,
      });
      await PaymentFactory.createMany<PaymentModel>(PaymentModel.name, 3, {
        userId: secondUserId,
      });

      const usecase = new UseCase(
        logger,
        paymentRepository,
        bankingService,
        bankMockIspb,
      );

      const pagination = new PaginationEntity();

      const result = await usecase.execute(pagination);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(pagination.page);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBeDefined();
      expect(result.pageTotal).toBe(
        Math.ceil(result.total / pagination.pageSize),
      );
      result.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.createdAt).toBeDefined();
      });
    });

    it('TC0006 - (As admin) - Should get payments filtered by userId successfully', async () => {
      const userId = uuidV4();
      const secondUserId = uuidV4();

      await PaymentFactory.createMany<PaymentModel>(PaymentModel.name, 3, {
        userId,
      });
      await PaymentFactory.createMany<PaymentModel>(PaymentModel.name, 3, {
        userId: secondUserId,
      });

      const usecase = new UseCase(
        logger,
        paymentRepository,
        bankingService,
        bankMockIspb,
      );

      const pagination = new PaginationEntity();
      const user = new UserEntity({ uuid: userId });

      const result = await usecase.execute(pagination, user);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(pagination.page);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBeDefined();
      expect(result.pageTotal).toBe(
        Math.ceil(result.total / pagination.pageSize),
      );
      result.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.user.uuid).toBe(userId);
        expect(res.createdAt).toBeDefined();
      });
    });

    it('TC0007 - (As admin) - Should get all payments filtered by single state successfully', async () => {
      await PaymentFactory.createMany<PaymentModel>(PaymentModel.name, 3, {
        state: PaymentState.PENDING,
      });
      await PaymentFactory.createMany<PaymentModel>(PaymentModel.name, 3, {
        state: PaymentState.SCHEDULED,
      });

      const usecase = new UseCase(
        logger,
        paymentRepository,
        bankingService,
        bankMockIspb,
      );

      const pagination = new PaginationEntity();
      const user = null;
      const wallet = null;
      const states = [PaymentState.SCHEDULED];

      const result = await usecase.execute(pagination, user, wallet, states);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(pagination.page);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBeDefined();
      expect(result.pageTotal).toBe(
        Math.ceil(result.total / pagination.pageSize),
      );
      result.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(states).toContain(res.state);
        expect(res.createdAt).toBeDefined();
      });
    });

    it('TC0008 - (As admin) - Should get all payments filtered by multiple states successfully', async () => {
      await PaymentFactory.createMany<PaymentModel>(PaymentModel.name, 3, {
        state: PaymentState.PENDING,
      });
      await PaymentFactory.createMany<PaymentModel>(PaymentModel.name, 3, {
        state: PaymentState.SCHEDULED,
      });
      await PaymentFactory.createMany<PaymentModel>(PaymentModel.name, 3, {
        state: PaymentState.CONFIRMED,
      });

      const usecase = new UseCase(
        logger,
        paymentRepository,
        bankingService,
        bankMockIspb,
      );

      const pagination = new PaginationEntity();
      const user = null;
      const wallet = null;
      const states = [PaymentState.SCHEDULED, PaymentState.CONFIRMED];

      const result = await usecase.execute(pagination, user, wallet, states);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(pagination.page);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBeDefined();
      expect(result.pageTotal).toBe(
        Math.ceil(result.total / pagination.pageSize),
      );
      result.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(states).toContain(res.state);
        expect(res.createdAt).toBeDefined();
      });
    });

    it('TC0009 - (As admin) - Should get all payments filtered by userId and single state successfully', async () => {
      const userId = uuidV4();
      const secondUserId = uuidV4();

      await PaymentFactory.createMany<PaymentModel>(PaymentModel.name, 3, {
        userId,
        state: PaymentState.PENDING,
      });
      await PaymentFactory.createMany<PaymentModel>(PaymentModel.name, 3, {
        userId,
        state: PaymentState.SCHEDULED,
      });
      await PaymentFactory.createMany<PaymentModel>(PaymentModel.name, 3, {
        userId: secondUserId,
        state: PaymentState.PENDING,
      });

      const usecase = new UseCase(
        logger,
        paymentRepository,
        bankingService,
        bankMockIspb,
      );

      const pagination = new PaginationEntity();
      const states = [PaymentState.SCHEDULED];
      const user = new UserEntity({ uuid: userId });

      const result = await usecase.execute(pagination, user, null, states);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(pagination.page);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBeDefined();
      expect(result.pageTotal).toBe(
        Math.ceil(result.total / pagination.pageSize),
      );
      result.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.user.uuid).toBe(userId);
        expect(states).toContain(res.state);
        expect(res.createdAt).toBeDefined();
      });
    });

    it('TC0010 - (As admin) - Should get all payments filtered by userId and multiple states successfully', async () => {
      const userId = uuidV4();
      const secondUserId = uuidV4();

      await PaymentFactory.createMany<PaymentModel>(PaymentModel.name, 3, {
        userId,
        state: PaymentState.PENDING,
      });
      await PaymentFactory.createMany<PaymentModel>(PaymentModel.name, 3, {
        userId,
        state: PaymentState.SCHEDULED,
      });
      await PaymentFactory.createMany<PaymentModel>(PaymentModel.name, 3, {
        userId: secondUserId,
        state: PaymentState.PENDING,
      });
      await PaymentFactory.createMany<PaymentModel>(PaymentModel.name, 3, {
        userId: secondUserId,
        state: PaymentState.SCHEDULED,
      });
      await PaymentFactory.createMany<PaymentModel>(PaymentModel.name, 3, {
        userId: secondUserId,
        state: PaymentState.CONFIRMED,
      });

      const usecase = new UseCase(
        logger,
        paymentRepository,
        bankingService,
        bankMockIspb,
      );

      const pagination = new PaginationEntity();
      const states = [PaymentState.SCHEDULED, PaymentState.CONFIRMED];
      const user = new UserEntity({ uuid: secondUserId });

      const result = await usecase.execute(pagination, user, null, states);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(pagination.page);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBeDefined();
      expect(result.pageTotal).toBe(
        Math.ceil(result.total / pagination.pageSize),
      );
      result.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.user.uuid).toBe(secondUserId);
        expect(states).toContain(res.state);
        expect(res.createdAt).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
