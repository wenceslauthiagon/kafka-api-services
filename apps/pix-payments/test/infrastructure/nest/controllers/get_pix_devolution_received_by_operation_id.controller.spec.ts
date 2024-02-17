import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger } from '@zro/common';
import {
  PaymentRepository,
  PixDevolutionReceivedRepository,
} from '@zro/pix-payments/domain';
import {
  GetPixDevolutionReceivedByOperationIdMicroserviceController as Controller,
  PixDevolutionReceivedDatabaseRepository,
  PixDevolutionReceivedModel,
  PaymentDatabaseRepository,
  PaymentModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { GetPixDevolutionReceivedByOperationIdRequest } from '@zro/pix-payments/interface';
import {
  PaymentFactory,
  PixDevolutionReceivedFactory,
} from '@zro/test/pix-payments/config';

describe('GetPixDevolutionReceivedByOperationIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let devolutionReceivedRepository: PixDevolutionReceivedRepository;
  let paymentRepository: PaymentRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    devolutionReceivedRepository =
      new PixDevolutionReceivedDatabaseRepository();
    paymentRepository = new PaymentDatabaseRepository();
  });

  describe('GetPixDevolutionReceivedByOperationId', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get devolutionReceived successfully with operation and user', async () => {
        const userId = uuidV4();
        const operationId = uuidV4();

        const payment = await PaymentFactory.create<PaymentModel>(
          PaymentModel.name,
        );
        const devolutionReceived =
          await PixDevolutionReceivedFactory.create<PixDevolutionReceivedModel>(
            PixDevolutionReceivedModel.name,
            {
              userId,
              operationId,
              transactionOriginalId: payment.id,
            },
          );

        const message: GetPixDevolutionReceivedByOperationIdRequest = {
          operationId,
          userId,
        };

        const result = await controller.execute(
          devolutionReceivedRepository,
          paymentRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(devolutionReceived.id);
        expect(result.value.state).toBe(devolutionReceived.state);
        expect(result.value.amount).toBe(devolutionReceived.amount);
        expect(result.value.endToEndId).toBe(devolutionReceived.endToEndId);
        expect(result.value.clientAccountNumber).toBe(
          devolutionReceived.clientAccountNumber,
        );
        expect(result.value.clientBank).toBeDefined();
        expect(result.value.clientBranch).toBe(devolutionReceived.clientBranch);
        expect(result.value.clientDocument).toBe(
          devolutionReceived.clientDocument,
        );
        expect(result.value.clientKey).toBe(devolutionReceived.clientKey);
        expect(result.value.clientName).toBe(devolutionReceived.clientName);
        expect(result.value.clientPersonType).toBe(
          devolutionReceived.clientPersonType,
        );
        expect(result.value.thirdPartAccountNumber).toBe(
          devolutionReceived.thirdPartAccountNumber,
        );
        expect(result.value.thirdPartAccountType).toBe(
          devolutionReceived.thirdPartAccountType,
        );
        expect(result.value.thirdPartBank).toBeDefined();
        expect(result.value.thirdPartBranch).toBe(
          devolutionReceived.thirdPartBranch,
        );
        expect(result.value.thirdPartDocument).toBe(
          devolutionReceived.thirdPartDocument,
        );
        expect(result.value.thirdPartKey).toBe(devolutionReceived.thirdPartKey);
        expect(result.value.thirdPartName).toBe(
          devolutionReceived.thirdPartName,
        );
        expect(result.value.thirdPartPersonType).toBe(
          devolutionReceived.thirdPartPersonType,
        );
        expect(result.value.userId).toBe(devolutionReceived.userId);
        expect(result.value.operationId).toBe(devolutionReceived.operationId);
        expect(result.value.paymentId).toBe(
          devolutionReceived.transactionOriginalId,
        );
        expect(result.value.createdAt).toStrictEqual(
          devolutionReceived.createdAt,
        );
      });

      it('TC0002 - Should get devolutionReceived successfully with operation (FOR ADMIN USER)', async () => {
        const operationId = uuidV4();
        const payment = await PaymentFactory.create<PaymentModel>(
          PaymentModel.name,
        );
        const devolutionReceived =
          await PixDevolutionReceivedFactory.create<PixDevolutionReceivedModel>(
            PixDevolutionReceivedModel.name,
            {
              operationId,
              transactionOriginalId: payment.id,
            },
          );

        const message: GetPixDevolutionReceivedByOperationIdRequest = {
          operationId,
        };

        const result = await controller.execute(
          devolutionReceivedRepository,
          paymentRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(devolutionReceived.id);
        expect(result.value.state).toBe(devolutionReceived.state);
        expect(result.value.amount).toBe(devolutionReceived.amount);
        expect(result.value.endToEndId).toBe(devolutionReceived.endToEndId);
        expect(result.value.clientAccountNumber).toBe(
          devolutionReceived.clientAccountNumber,
        );
        expect(result.value.clientBank).toBeDefined();
        expect(result.value.clientBranch).toBe(devolutionReceived.clientBranch);
        expect(result.value.clientDocument).toBe(
          devolutionReceived.clientDocument,
        );
        expect(result.value.clientKey).toBe(devolutionReceived.clientKey);
        expect(result.value.clientName).toBe(devolutionReceived.clientName);
        expect(result.value.clientPersonType).toBe(
          devolutionReceived.clientPersonType,
        );
        expect(result.value.thirdPartAccountNumber).toBe(
          devolutionReceived.thirdPartAccountNumber,
        );
        expect(result.value.thirdPartAccountType).toBe(
          devolutionReceived.thirdPartAccountType,
        );
        expect(result.value.thirdPartBank).toBeDefined();
        expect(result.value.thirdPartBranch).toBe(
          devolutionReceived.thirdPartBranch,
        );
        expect(result.value.thirdPartDocument).toBe(
          devolutionReceived.thirdPartDocument,
        );
        expect(result.value.thirdPartKey).toBe(devolutionReceived.thirdPartKey);
        expect(result.value.thirdPartName).toBe(
          devolutionReceived.thirdPartName,
        );
        expect(result.value.thirdPartPersonType).toBe(
          devolutionReceived.thirdPartPersonType,
        );
        expect(result.value.userId).toBe(devolutionReceived.userId);
        expect(result.value.operationId).toBe(devolutionReceived.operationId);
        expect(result.value.paymentId).toBe(
          devolutionReceived.transactionOriginalId,
        );
        expect(result.value.createdAt).toStrictEqual(
          devolutionReceived.createdAt,
        );
      });

      it('TC0003 - Should get devolutionReceived successfully with operation and wallet', async () => {
        const walletId = uuidV4();
        const operationId = uuidV4();

        const payment = await PaymentFactory.create<PaymentModel>(
          PaymentModel.name,
        );
        const devolutionReceived =
          await PixDevolutionReceivedFactory.create<PixDevolutionReceivedModel>(
            PixDevolutionReceivedModel.name,
            {
              walletId,
              operationId,
              transactionOriginalId: payment.id,
            },
          );

        const message: GetPixDevolutionReceivedByOperationIdRequest = {
          operationId,
          walletId,
        };

        const result = await controller.execute(
          devolutionReceivedRepository,
          paymentRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(devolutionReceived.id);
        expect(result.value.state).toBe(devolutionReceived.state);
        expect(result.value.amount).toBe(devolutionReceived.amount);
        expect(result.value.endToEndId).toBe(devolutionReceived.endToEndId);
        expect(result.value.clientAccountNumber).toBe(
          devolutionReceived.clientAccountNumber,
        );
        expect(result.value.clientBank).toBeDefined();
        expect(result.value.clientBranch).toBe(devolutionReceived.clientBranch);
        expect(result.value.clientDocument).toBe(
          devolutionReceived.clientDocument,
        );
        expect(result.value.clientKey).toBe(devolutionReceived.clientKey);
        expect(result.value.clientName).toBe(devolutionReceived.clientName);
        expect(result.value.clientPersonType).toBe(
          devolutionReceived.clientPersonType,
        );
        expect(result.value.thirdPartAccountNumber).toBe(
          devolutionReceived.thirdPartAccountNumber,
        );
        expect(result.value.thirdPartAccountType).toBe(
          devolutionReceived.thirdPartAccountType,
        );
        expect(result.value.thirdPartBank).toBeDefined();
        expect(result.value.thirdPartBranch).toBe(
          devolutionReceived.thirdPartBranch,
        );
        expect(result.value.thirdPartDocument).toBe(
          devolutionReceived.thirdPartDocument,
        );
        expect(result.value.thirdPartKey).toBe(devolutionReceived.thirdPartKey);
        expect(result.value.thirdPartName).toBe(
          devolutionReceived.thirdPartName,
        );
        expect(result.value.thirdPartPersonType).toBe(
          devolutionReceived.thirdPartPersonType,
        );
        expect(result.value.userId).toBe(devolutionReceived.userId);
        expect(result.value.operationId).toBe(devolutionReceived.operationId);
        expect(result.value.paymentId).toBe(
          devolutionReceived.transactionOriginalId,
        );
        expect(result.value.createdAt).toStrictEqual(
          devolutionReceived.createdAt,
        );
      });

      it('TC0003 - Should not get devolutionReceived successfully with wallet not found', async () => {
        const walletId = uuidV4();
        const operationId = uuidV4();

        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedModel>(
          PixDevolutionReceivedModel.name,
          { operationId },
        );

        const message: GetPixDevolutionReceivedByOperationIdRequest = {
          operationId,
          walletId,
        };

        const result = await controller.execute(
          devolutionReceivedRepository,
          paymentRepository,
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
