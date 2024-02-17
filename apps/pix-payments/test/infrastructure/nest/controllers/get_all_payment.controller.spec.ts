import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
  getMoment,
} from '@zro/common';
import { BankEntity } from '@zro/banking/domain';
import { PaymentRepository } from '@zro/pix-payments/domain';
import { BankingService } from '@zro/pix-payments/application';
import {
  GetAllPaymentRequest,
  GetAllPaymentRequestSort,
} from '@zro/pix-payments/interface';
import {
  PaymentModel,
  GetAllPaymentMicroserviceController as Controller,
  PaymentDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PaymentFactory } from '@zro/test/pix-payments/config';
import { BankFactory } from '@zro/test/banking/config';
import { KafkaContext } from '@nestjs/microservices';

describe('GetAllPaymentMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let paymentRepository: PaymentRepository;

  const bankingService = createMock<BankingService>();
  const mockGetBankingService = On(bankingService).get(
    method((mock) => mock.getBankByIspb),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    paymentRepository = new PaymentDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetAllPayment', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get payments successfully', async () => {
        const userId = uuidV4();
        await PaymentFactory.createMany<PaymentModel>(PaymentModel.name, 3, {
          userId,
        });

        const bankMock = await BankFactory.create<BankEntity>(BankEntity.name);
        mockGetBankingService.mockResolvedValue(bankMock);

        const message: GetAllPaymentRequest = {
          userId,
        };

        const result = await controller.execute(
          paymentRepository,
          bankingService,
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
          expect(res.userId).toBe(userId);
        });
        expect(mockGetBankingService).toHaveBeenCalledTimes(1);
      });

      it('TC0002 - Should get payments successfully with pagination sort', async () => {
        const userId = uuidV4();
        await PaymentFactory.createMany<PaymentModel>(PaymentModel.name, 3, {
          userId,
        });

        const bankMock = await BankFactory.create<BankEntity>(BankEntity.name);
        mockGetBankingService.mockResolvedValue(bankMock);

        const message: GetAllPaymentRequest = {
          userId,
          sort: GetAllPaymentRequestSort.CREATED_AT,
        };

        const result = await controller.execute(
          paymentRepository,
          bankingService,
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
          expect(res.userId).toBe(userId);
        });
        expect(mockGetBankingService).toHaveBeenCalledTimes(1);
      });

      it('TC0003 - Should get payments successfully with payment date filter', async () => {
        const userId = uuidV4();

        await PaymentFactory.createMany<PaymentModel>(PaymentModel.name, 2, {
          userId,
          paymentDate: getMoment().subtract(1, 'hours').toDate(),
        });

        const bankMock = await BankFactory.create<BankEntity>(BankEntity.name);
        mockGetBankingService.mockResolvedValue(bankMock);

        const message: GetAllPaymentRequest = {
          userId,
          paymentDatePeriodStart: getMoment().subtract(1, 'days').toDate(),
          paymentDatePeriodEnd: getMoment().toDate(),
          createdAtPeriodStart: getMoment().subtract(1, 'days').toDate(),
          createdAtPeriodEnd: getMoment().toDate(),
        };

        const result = await controller.execute(
          paymentRepository,
          bankingService,
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
        expect(result.value.total).toBe(2);
        expect(result.value.pageTotal).toBe(
          Math.ceil(result.value.total / result.value.pageSize),
        );
        result.value.data.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.operationId).toBeDefined();
          expect(res.createdAt).toBeDefined();
          expect(res.userId).toBe(userId);
          expect(res.state).toBeDefined();
        });
        expect(mockGetBankingService).toHaveBeenCalledTimes(1);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0004 - Should get payments with incorrect userId', async () => {
        const message: GetAllPaymentRequest = {
          userId: 'x',
        };

        const testScript = () =>
          controller.execute(
            paymentRepository,
            bankingService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockGetBankingService).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
