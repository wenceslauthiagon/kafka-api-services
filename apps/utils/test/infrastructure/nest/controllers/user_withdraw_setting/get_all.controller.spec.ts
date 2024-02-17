import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import {
  GetAllUserWithdrawSettingMicroserviceController as Controller,
  UserWithdrawSettingDatabaseRepository,
  UserWithdrawSettingModel,
} from '@zro/utils/infrastructure';
import { AppModule } from '@zro/utils/infrastructure/nest/modules/app.module';
import { KafkaContext } from '@nestjs/microservices';
import { GetAllUserWithdrawSettingRequest } from '@zro/utils/interface';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { UserWithdrawSettingFactory } from '@zro/test/utils/config';

describe('GetAllWithdrawalsByWalletMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  const withdrawRepository = new UserWithdrawSettingDatabaseRepository();

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetAllWithdrawalsByWallet', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should be able to get withdrawals successfully', async () => {
        const withdraw =
          await UserWithdrawSettingFactory.create<UserWithdrawSettingModel>(
            UserWithdrawSettingModel.name,
          );

        const message: GetAllUserWithdrawSettingRequest = {
          walletId: withdraw.walletId,
        };

        const result = await controller.execute(
          withdrawRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.page).toBe(1);
        expect(result.value.total).toBe(1);
        expect(result.value.pageTotal).toBe(1);
        result.value.data.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBe(withdraw.id);
          expect(res.balance).toBe(withdraw.balance);
          expect(res.state).toBe(withdraw.state);
          expect(res.type).toBe(withdraw.type);
          expect(res.day).toBe(withdraw.day);
          expect(res.weekDay).toBe(withdraw.weekDay);
        });
      });

      it('TC0002 - Should be able get an empty array with no withdrawals was found', async () => {
        const message: GetAllUserWithdrawSettingRequest = {
          walletId: faker.datatype.uuid(),
        };

        const result = await controller.execute(
          withdrawRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.data).toBeDefined();
        expect(result.value.data.length).toBe(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
