import { createMock } from 'ts-auto-mock';
import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
  getMoment,
} from '@zro/common';
import { WarningPixDepositRepository } from '@zro/pix-payments/domain';
import {
  GetAllWarningPixDepositMicroserviceController as Controller,
  WarningPixDepositDatabaseRepository,
  WarningPixDepositModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { WarningPixDepositFactory } from '@zro/test/pix-payments/config';
import {
  GetAllPaymentRequest,
  GetAllWarningPixDepositRequest,
  GetAllWarningPixDepositRequestSort,
} from '@zro/pix-payments/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('GetAllWarningPixDepositMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let warningPixDepositRepository: WarningPixDepositRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    warningPixDepositRepository = new WarningPixDepositDatabaseRepository();
  });

  describe('With valid parameters', () => {
    it('TC0001 - Should get warning pix deposits successfully', async () => {
      const userId = uuidV4();

      await WarningPixDepositFactory.createMany<WarningPixDepositModel>(
        WarningPixDepositModel.name,
        3,
        { userId },
      );

      const message: GetAllWarningPixDepositRequest = {
        userId,
      };

      const result = await controller.execute(
        warningPixDepositRepository,
        logger,
        message,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();
      expect(result.value).toBeDefined();
      expect(result.value.data).toBeDefined();
      expect(result.value.page).toBeDefined();
      expect(result.value.pageSize).toBeDefined();
      expect(result.value.total).toBeDefined();
      expect(result.value.pageTotal).toBe(
        Math.ceil(result.value.total / result.value.pageSize),
      );
      result.value.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.operationId).toBeDefined();
        expect(res.createdAt).toBeDefined();
        expect(res.transactionTag).toBeDefined();
        expect(res.state).toBeDefined();
      });
    });

    it('TC0002 - Should get warning pix deposits successfully ordered by created at', async () => {
      const userId = uuidV4();

      await WarningPixDepositFactory.createMany<WarningPixDepositModel>(
        WarningPixDepositModel.name,
        3,
        { userId },
      );

      const message: GetAllWarningPixDepositRequest = {
        userId,
        sort: GetAllWarningPixDepositRequestSort.CREATED_AT,
      };

      const result = await controller.execute(
        warningPixDepositRepository,
        logger,
        message,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();

      expect(result.value).toBeDefined();
      expect(result.value.data).toBeDefined();
      expect(result.value.page).toBeDefined();
      expect(result.value.pageSize).toBeDefined();
      expect(result.value.total).toBeDefined();
      expect(result.value.pageTotal).toBe(
        Math.ceil(result.value.total / result.value.pageSize),
      );
      result.value.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.operationId).toBeDefined();
        expect(res.createdAt).toBeDefined();
        expect(res.transactionTag).toBeDefined();
        expect(res.state).toBeDefined();
      });
    });

    it('TC0003 - Should get warning pix deposits successfully ordered by updated at', async () => {
      const userId = uuidV4();

      await WarningPixDepositFactory.createMany<WarningPixDepositModel>(
        WarningPixDepositModel.name,
        3,
        { userId },
      );

      const message: GetAllWarningPixDepositRequest = {
        userId,
        sort: GetAllWarningPixDepositRequestSort.UPDATED_AT,
      };

      const result = await controller.execute(
        warningPixDepositRepository,
        logger,
        message,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();

      expect(result.value).toBeDefined();
      expect(result.value.data).toBeDefined();
      expect(result.value.page).toBeDefined();
      expect(result.value.pageSize).toBeDefined();
      expect(result.value.total).toBeDefined();
      expect(result.value.pageTotal).toBe(
        Math.ceil(result.value.total / result.value.pageSize),
      );
      result.value.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.operationId).toBeDefined();
        expect(res.createdAt).toBeDefined();
        expect(res.transactionTag).toBeDefined();
        expect(res.state).toBeDefined();
      });
    });

    it('TC0004 - Should get warning pix deposits successfully ordered by state', async () => {
      const userId = uuidV4();

      await WarningPixDepositFactory.createMany<WarningPixDepositModel>(
        WarningPixDepositModel.name,
        3,
        { userId },
      );

      const message: GetAllWarningPixDepositRequest = {
        userId,
        sort: GetAllWarningPixDepositRequestSort.STATE,
      };

      const result = await controller.execute(
        warningPixDepositRepository,
        logger,
        message,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();

      expect(result.value).toBeDefined();
      expect(result.value.data).toBeDefined();
      expect(result.value.page).toBeDefined();
      expect(result.value.pageSize).toBeDefined();
      expect(result.value.total).toBeDefined();
      expect(result.value.pageTotal).toBe(
        Math.ceil(result.value.total / result.value.pageSize),
      );
      result.value.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.operationId).toBeDefined();
        expect(res.createdAt).toBeDefined();
        expect(res.transactionTag).toBeDefined();
        expect(res.state).toBeDefined();
      });
    });

    it('TC0005 - Should get warning pix deposits successfully with created at period filter', async () => {
      const userId = uuidV4();

      await WarningPixDepositFactory.createMany<WarningPixDepositModel>(
        WarningPixDepositModel.name,
        2,
        {
          userId,
          createdAt: getMoment().subtract(1, 'hours').toDate(),
        },
      );

      const message: GetAllWarningPixDepositRequest = {
        userId,
        createdAtPeriodStart: getMoment().subtract(1, 'days').toDate(),
        createdAtPeriodEnd: getMoment().toDate(),
      };

      const result = await controller.execute(
        warningPixDepositRepository,
        logger,
        message,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();

      expect(result.value).toBeDefined();
      expect(result.value.data).toBeDefined();
      expect(result.value.page).toBeDefined();
      expect(result.value.pageSize).toBeDefined();
      expect(result.value.total).toBeDefined();
      expect(result.value.pageTotal).toBe(
        Math.ceil(result.value.total / result.value.pageSize),
      );
      result.value.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.operationId).toBeDefined();
        expect(res.createdAt).toBeDefined();
        expect(res.transactionTag).toBeDefined();
        expect(res.state).toBeDefined();
      });
    });

    it('TC0006 - Should get warning pix deposits successfully with updated at period filter', async () => {
      const userId = uuidV4();

      await WarningPixDepositFactory.createMany<WarningPixDepositModel>(
        WarningPixDepositModel.name,
        2,
        {
          userId,
          createdAt: getMoment().subtract(3, 'hours').toDate(),
          updatedAt: getMoment().subtract(1, 'hours').toDate(),
        },
      );

      const message: GetAllWarningPixDepositRequest = {
        userId,
        updatedAtPeriodStart: getMoment().subtract(1, 'days').toDate(),
        updatedAtPeriodEnd: getMoment().toDate(),
      };

      const result = await controller.execute(
        warningPixDepositRepository,
        logger,
        message,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();

      expect(result.value).toBeDefined();
      expect(result.value.data).toBeDefined();
      expect(result.value.page).toBeDefined();
      expect(result.value.pageSize).toBeDefined();
      expect(result.value.total).toBeDefined();
      expect(result.value.pageTotal).toBe(
        Math.ceil(result.value.total / result.value.pageSize),
      );
      result.value.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.operationId).toBeDefined();
        expect(res.createdAt).toBeDefined();
        expect(res.transactionTag).toBeDefined();
        expect(res.state).toBeDefined();
      });
    });

    it('TC0007 - Should get warning pix deposits successfully with transaction tag filter', async () => {
      const userId = uuidV4();
      const transactionTag = 'PIXREC';

      await WarningPixDepositFactory.createMany<WarningPixDepositModel>(
        WarningPixDepositModel.name,
        2,
        {
          userId,
          transactionTag,
        },
      );

      const message: GetAllWarningPixDepositRequest = {
        userId,
        transactionTag,
      };

      const result = await controller.execute(
        warningPixDepositRepository,
        logger,
        message,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();

      expect(result.value).toBeDefined();
      expect(result.value.data).toBeDefined();
      expect(result.value.page).toBeDefined();
      expect(result.value.pageSize).toBeDefined();
      expect(result.value.total).toBeDefined();
      expect(result.value.pageTotal).toBe(
        Math.ceil(result.value.total / result.value.pageSize),
      );
      result.value.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.operationId).toBeDefined();
        expect(res.createdAt).toBeDefined();
        expect(res.transactionTag).toBe(transactionTag);
        expect(res.state).toBeDefined();
      });
    });

    it('TC0008 - Should get warning pix deposits successfully with operation id filter', async () => {
      const userId = uuidV4();
      const operationId = uuidV4();

      await WarningPixDepositFactory.createMany<WarningPixDepositModel>(
        WarningPixDepositModel.name,
        2,
        {
          userId,
          operationId,
        },
      );

      const message: GetAllWarningPixDepositRequest = {
        userId,
        operationId,
      };

      const result = await controller.execute(
        warningPixDepositRepository,
        logger,
        message,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();

      expect(result.value).toBeDefined();
      expect(result.value.data).toBeDefined();
      expect(result.value.page).toBeDefined();
      expect(result.value.pageSize).toBeDefined();
      expect(result.value.total).toBeDefined();
      expect(result.value.pageTotal).toBe(
        Math.ceil(result.value.total / result.value.pageSize),
      );
      result.value.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.operationId).toBe(operationId);
        expect(res.createdAt).toBeDefined();
        expect(res.state).toBeDefined();
      });
    });
  });

  describe('With invalid parameters', () => {
    it('TC0009 - Should not get warning pix deposits with invalid user ID', async () => {
      const message: GetAllPaymentRequest = {
        userId: 'x',
      };

      const testScript = () =>
        controller.execute(warningPixDepositRepository, logger, message, ctx);

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
