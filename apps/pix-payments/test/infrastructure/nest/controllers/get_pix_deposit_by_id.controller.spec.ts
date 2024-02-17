import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger } from '@zro/common';
import { PixDepositRepository } from '@zro/pix-payments/domain';
import {
  GetPixDepositByIdMicroserviceController as Controller,
  PixDepositDatabaseRepository,
  PixDepositModel,
} from '@zro/pix-payments/infrastructure';
import { GetPixDepositByIdRequest } from '@zro/pix-payments/interface';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PixDepositFactory } from '@zro/test/pix-payments/config';

describe('GetPixDepositByIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let depositRepository: PixDepositRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    depositRepository = new PixDepositDatabaseRepository();
  });

  describe('GetPixDepositById', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get deposit successfully by id', async () => {
        const deposit = await PixDepositFactory.create<PixDepositModel>(
          PixDepositModel.name,
        );

        const message: GetPixDepositByIdRequest = {
          id: deposit.id,
        };

        const result = await controller.execute(
          depositRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.clientAccountNumber).toBe(
          deposit.clientAccountNumber,
        );
        expect(result.value.clientBank).toBeDefined();
        expect(result.value.clientBranch).toBe(deposit.clientBranch);
        expect(result.value.clientDocument).toBe(deposit.clientDocument);
        expect(result.value.clientKey).toBe(deposit.clientKey);
        expect(result.value.clientName).toBe(deposit.clientName);
        expect(result.value.clientPersonType).toBe(deposit.clientPersonType);
        expect(result.value.thirdPartAccountNumber).toBe(
          deposit.thirdPartAccountNumber,
        );
        expect(result.value.thirdPartAccountType).toBe(
          deposit.thirdPartAccountType,
        );
        expect(result.value.thirdPartBank).toBeDefined();
        expect(result.value.thirdPartBranch).toBe(deposit.thirdPartBranch);
        expect(result.value.thirdPartDocument).toBe(deposit.thirdPartDocument);
        expect(result.value.thirdPartKey).toBe(deposit.thirdPartKey);
        expect(result.value.thirdPartName).toBe(deposit.thirdPartName);
        expect(result.value.thirdPartPersonType).toBe(
          deposit.thirdPartPersonType,
        );
        expect(result.value.state).toBe(deposit.state);
        expect(result.value.createdAt).toStrictEqual(deposit.createdAt);
      });

      it('TC0002 - Should get deposit successfully by id and user', async () => {
        const deposit = await PixDepositFactory.create<PixDepositModel>(
          PixDepositModel.name,
        );

        const message: GetPixDepositByIdRequest = {
          id: deposit.id,
          userId: deposit.userId,
        };

        const result = await controller.execute(
          depositRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.clientAccountNumber).toBe(
          deposit.clientAccountNumber,
        );
        expect(result.value.clientBank).toBeDefined();
        expect(result.value.clientBranch).toBe(deposit.clientBranch);
        expect(result.value.clientDocument).toBe(deposit.clientDocument);
        expect(result.value.clientKey).toBe(deposit.clientKey);
        expect(result.value.clientName).toBe(deposit.clientName);
        expect(result.value.clientPersonType).toBe(deposit.clientPersonType);
        expect(result.value.thirdPartAccountNumber).toBe(
          deposit.thirdPartAccountNumber,
        );
        expect(result.value.thirdPartAccountType).toBe(
          deposit.thirdPartAccountType,
        );
        expect(result.value.thirdPartBank).toBeDefined();
        expect(result.value.thirdPartBranch).toBe(deposit.thirdPartBranch);
        expect(result.value.thirdPartDocument).toBe(deposit.thirdPartDocument);
        expect(result.value.thirdPartKey).toBe(deposit.thirdPartKey);
        expect(result.value.thirdPartName).toBe(deposit.thirdPartName);
        expect(result.value.thirdPartPersonType).toBe(
          deposit.thirdPartPersonType,
        );
        expect(result.value.state).toBe(deposit.state);
        expect(result.value.createdAt).toStrictEqual(deposit.createdAt);
      });

      it('TC0003 - Should get deposit successfully by id and wallet', async () => {
        const deposit = await PixDepositFactory.create<PixDepositModel>(
          PixDepositModel.name,
        );

        const message: GetPixDepositByIdRequest = {
          id: deposit.id,
          walletId: deposit.walletId,
        };

        const result = await controller.execute(
          depositRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.clientAccountNumber).toBe(
          deposit.clientAccountNumber,
        );
        expect(result.value.clientBank).toBeDefined();
        expect(result.value.clientBranch).toBe(deposit.clientBranch);
        expect(result.value.clientDocument).toBe(deposit.clientDocument);
        expect(result.value.clientKey).toBe(deposit.clientKey);
        expect(result.value.clientName).toBe(deposit.clientName);
        expect(result.value.clientPersonType).toBe(deposit.clientPersonType);
        expect(result.value.thirdPartAccountNumber).toBe(
          deposit.thirdPartAccountNumber,
        );
        expect(result.value.thirdPartAccountType).toBe(
          deposit.thirdPartAccountType,
        );
        expect(result.value.thirdPartBank).toBeDefined();
        expect(result.value.thirdPartBranch).toBe(deposit.thirdPartBranch);
        expect(result.value.thirdPartDocument).toBe(deposit.thirdPartDocument);
        expect(result.value.thirdPartKey).toBe(deposit.thirdPartKey);
        expect(result.value.thirdPartName).toBe(deposit.thirdPartName);
        expect(result.value.thirdPartPersonType).toBe(
          deposit.thirdPartPersonType,
        );
        expect(result.value.state).toBe(deposit.state);
        expect(result.value.createdAt).toStrictEqual(deposit.createdAt);
      });

      it('TC0004 - Should not get deposit by id and wallet not found', async () => {
        const deposit = await PixDepositFactory.create<PixDepositModel>(
          PixDepositModel.name,
        );

        const message: GetPixDepositByIdRequest = {
          id: deposit.id,
          walletId: uuidV4(),
        };

        const result = await controller.execute(
          depositRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeNull();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
