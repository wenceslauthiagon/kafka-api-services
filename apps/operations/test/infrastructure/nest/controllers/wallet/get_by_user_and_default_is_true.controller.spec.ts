import { Sequelize } from 'sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import {
  DATABASE_PROVIDER,
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { Wallet } from '@zro/operations/domain';
import { User, UserEntity } from '@zro/users/domain';
import {
  GetWalletByUserAndDefaultIsTrueMicroserviceController as Controller,
  WalletDatabaseRepository,
  WalletModel,
} from '@zro/operations/infrastructure';
import {
  GetWalletByUserAndDefaultIsTrueRequest,
  GetWalletByUserAndDefaultIsTrueResponse,
} from '@zro/operations/interface';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { WalletFactory } from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';
import { KafkaContext } from '@nestjs/microservices';
import { createMock } from 'ts-auto-mock';

describe('GetWalletByUserAndDefaultIsTrueMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let sequelize: Sequelize;

  const createUser = async (): Promise<User> => {
    return UserFactory.create<UserEntity>(UserEntity.name, { active: true });
  };

  const createDefaultWallet = async (user: User): Promise<Wallet> => {
    const found = await WalletModel.findOne({
      where: { userUUID: user.uuid, default: true },
    });

    const wallet =
      found ??
      (await WalletFactory.create<WalletModel>(WalletModel.name, {
        userId: user.id,
        userUUID: user.uuid,
        default: true,
      }));

    return wallet.toDomain();
  };

  const executeController = async (
    user: User,
  ): Promise<GetWalletByUserAndDefaultIsTrueResponse> => {
    const transaction = await sequelize.transaction();

    try {
      const walletRepository = new WalletDatabaseRepository(transaction);

      const request: GetWalletByUserAndDefaultIsTrueRequest = {
        userId: user.uuid,
      };

      const response = await controller.execute(
        walletRepository,
        logger,
        request,
        ctx,
      );

      await transaction.commit();

      return response.value;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    sequelize = module.get(DATABASE_PROVIDER);
  });

  describe('Get default wallet by user', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get default wallet by user successfully', async () => {
        const user = await createUser();
        const wallet = await createDefaultWallet(user);

        const response = await executeController(user);

        expect(response).not.toBeNull();
        expect(response.uuid).toBe(wallet.uuid);
        expect(response.state).toBe(wallet.state);
        expect(response.userId).toBe(wallet.user.uuid);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not get default wallet with invalid user id', async () => {
        const user = await createUser();
        await createDefaultWallet(user);

        const testScript = () => executeController(new UserEntity({ id: -1 }));

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      });

      it('TC0003 - Should not get default wallet with invalid user id format', async () => {
        const user = await createUser();
        await createDefaultWallet(user);

        const testScript = () =>
          executeController(new UserEntity({ id: null }));

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
