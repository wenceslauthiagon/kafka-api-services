import { faker } from '@faker-js/faker/locale/pt_BR';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  OperationRepository,
  WalletAccountRepository,
} from '@zro/operations/domain';
import {
  OperationModel,
  GetAllOperationsByFilterMicroserviceController as Controller,
  OperationDatabaseRepository,
  UserServiceKafka,
  WalletAccountDatabaseRepository,
  WalletAccountModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { GetAllOperationsByFilterRequest } from '@zro/operations/interface';
import {
  OperationFactory,
  WalletAccountFactory,
} from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';

describe('GetAllOperationsByFilterMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let operationRepository: OperationRepository;
  let walletAccountRepository: WalletAccountRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  const userService: UserServiceKafka = createMock<UserServiceKafka>();
  const mockGetUserByIdService: jest.Mock = On(userService).get(
    method((mock) => mock.getUserById),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    operationRepository = new OperationDatabaseRepository();
    walletAccountRepository = new WalletAccountDatabaseRepository();
  });

  describe('With valid parameters', () => {
    it('TC0001 - Should get operation by filter successfully', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const walletAccount =
        await WalletAccountFactory.create<WalletAccountModel>(
          WalletAccountModel.name,
        );

      await OperationFactory.create<OperationModel>(OperationModel.name, {
        ownerId: user.id,
        ownerWalletAccountId: walletAccount.id,
        beneficiaryId: null,
        beneficiaryWalletAccountId: null,
      });

      mockGetUserByIdService.mockResolvedValue(user);

      const message: GetAllOperationsByFilterRequest = {};

      const result = await controller.execute(
        operationRepository,
        walletAccountRepository,
        userService,
        logger,
        message,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.value).toBeDefined();
      expect(result.value.page).toBe(1);
      expect(result.value.total).toBeDefined();
      expect(result.value.pageTotal).toBeDefined();
      result.value.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.fee).toBeDefined();
        expect(res.state).toBeDefined();
        expect(res.description).toBeDefined();
        expect(res.value).toBeDefined();
        expect(res.createdAt).toBeDefined();
        expect(res.currencyId).toBeDefined();
        expect(res.transactionTag).toBeDefined();
        expect(res.ownerWalletId).toBeDefined();
        expect(res.ownerId).toBeDefined();
      });
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not get operation with incorrect transaction type id', async () => {
      const tag = faker.lorem.words(1);

      const message: GetAllOperationsByFilterRequest = {
        transactionTag: tag,
      };

      const result = await controller.execute(
        operationRepository,
        walletAccountRepository,
        userService,
        logger,
        message,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.value.data.length).toBe(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
