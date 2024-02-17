import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import {
  DecodedPixAccountEntity,
  DecodedPixAccountRepository,
  DecodedQrCodeEntity,
  DecodedQrCodeRepository,
  PaymentRepository,
  PaymentType,
} from '@zro/pix-payments/domain';
import {
  DecodedPixAccountNotFoundException,
  DecodedQrCodeNotFoundException,
} from '@zro/pix-payments/application';
import {
  PaymentModel,
  GetPaymentByOperationIdMicroserviceController as Controller,
  PaymentDatabaseRepository,
  DecodedQrCodeModel,
  DecodedPixAccountModel,
  DecodedQrCodeDatabaseRepository,
  DecodedPixAccountDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { GetPaymentByOperationIdRequest } from '@zro/pix-payments/interface';
import {
  DecodedPixAccountFactory,
  DecodedQrCodeFactory,
  PaymentFactory,
} from '@zro/test/pix-payments/config';

describe('GetPaymentByOperationIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let paymentRepository: PaymentRepository;
  let decodedQrCodeRepository: DecodedQrCodeRepository;
  let decodedPixAccountRepository: DecodedPixAccountRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    paymentRepository = new PaymentDatabaseRepository();
    decodedQrCodeRepository = new DecodedQrCodeDatabaseRepository();
    decodedPixAccountRepository = new DecodedPixAccountDatabaseRepository();
  });

  describe('GetPaymentByOperationId', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get payments successfully with operation and user', async () => {
        const userId = uuidV4();
        const operationId = uuidV4();
        const decodedQrCode =
          await DecodedQrCodeFactory.create<DecodedQrCodeModel>(
            DecodedQrCodeModel.name,
          );
        const decodedPixAccount =
          await DecodedPixAccountFactory.create<DecodedPixAccountModel>(
            DecodedPixAccountModel.name,
          );
        await PaymentFactory.create<PaymentModel>(PaymentModel.name, {
          userId,
          operationId,
          decodedQrCode: decodedQrCode,
          decodedPixAccount: decodedPixAccount,
        });

        const message: GetPaymentByOperationIdRequest = {
          operationId,
          userId,
        };

        const result = await controller.execute(
          paymentRepository,
          decodedQrCodeRepository,
          decodedPixAccountRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.description).toBeDefined();
        expect(result.value.endToEndId).toBeDefined();
        expect(result.value.operationId).toBeDefined();
        expect(result.value.key).toBeDefined();
        expect(result.value.paymentDate).toBeDefined();
        expect(result.value.paymentType).toBeDefined();
        expect(result.value.state).toBeDefined();
        expect(result.value.transactionTag).toBeDefined();
        expect(result.value.txId).toBeDefined();
        expect(result.value.userId).toBeDefined();
        expect(result.value.ownerAccountNumber).toBeDefined();
        expect(result.value.ownerBranch).toBeDefined();
        expect(result.value.ownerDocument).toBeDefined();
        expect(result.value.ownerFullName).toBeDefined();
        expect(result.value.beneficiaryAccountNumber).toBeDefined();
        expect(result.value.beneficiaryAccountType).toBeDefined();
        expect(result.value.beneficiaryBankIspb).toBeDefined();
        expect(result.value.beneficiaryBankName).toBeDefined();
        expect(result.value.beneficiaryBranch).toBeDefined();
        expect(result.value.beneficiaryDocument).toBeDefined();
        expect(result.value.beneficiaryName).toBeDefined();
        expect(result.value.beneficiaryPersonType).toBeDefined();
        expect(result.value.createdAt).toBeDefined();
        expect(result.value.updatedAt).toBeDefined();
        expect(result.value.failed).toBeDefined();
      });

      it('TC0002 - Should get payments successfully with only operation (FOR ADMIN USER)', async () => {
        const operationId = uuidV4();
        const decodedQrCode =
          await DecodedQrCodeFactory.create<DecodedQrCodeModel>(
            DecodedQrCodeModel.name,
          );
        const decodedPixAccount =
          await DecodedPixAccountFactory.create<DecodedPixAccountModel>(
            DecodedPixAccountModel.name,
          );
        await PaymentFactory.create<PaymentModel>(PaymentModel.name, {
          operationId,
          decodedQrCode: decodedQrCode,
          decodedPixAccount: decodedPixAccount,
        });

        const message: GetPaymentByOperationIdRequest = {
          operationId,
        };

        const result = await controller.execute(
          paymentRepository,
          decodedQrCodeRepository,
          decodedPixAccountRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.description).toBeDefined();
        expect(result.value.endToEndId).toBeDefined();
        expect(result.value.operationId).toBeDefined();
        expect(result.value.key).toBeDefined();
        expect(result.value.paymentDate).toBeDefined();
        expect(result.value.paymentType).toBeDefined();
        expect(result.value.state).toBeDefined();
        expect(result.value.transactionTag).toBeDefined();
        expect(result.value.txId).toBeDefined();
        expect(result.value.userId).toBeDefined();
        expect(result.value.ownerAccountNumber).toBeDefined();
        expect(result.value.ownerBranch).toBeDefined();
        expect(result.value.ownerDocument).toBeDefined();
        expect(result.value.ownerFullName).toBeDefined();
        expect(result.value.beneficiaryAccountNumber).toBeDefined();
        expect(result.value.beneficiaryAccountType).toBeDefined();
        expect(result.value.beneficiaryBankIspb).toBeDefined();
        expect(result.value.beneficiaryBankName).toBeDefined();
        expect(result.value.beneficiaryBranch).toBeDefined();
        expect(result.value.beneficiaryDocument).toBeDefined();
        expect(result.value.beneficiaryName).toBeDefined();
        expect(result.value.beneficiaryPersonType).toBeDefined();
        expect(result.value.createdAt).toBeDefined();
        expect(result.value.updatedAt).toBeDefined();
        expect(result.value.failed).toBeDefined();
      });

      it('TC0003 - Should get payments successfully with operation and wallet', async () => {
        const walletId = uuidV4();
        const operationId = uuidV4();
        const decodedQrCode =
          await DecodedQrCodeFactory.create<DecodedQrCodeModel>(
            DecodedQrCodeModel.name,
          );
        const decodedPixAccount =
          await DecodedPixAccountFactory.create<DecodedPixAccountModel>(
            DecodedPixAccountModel.name,
          );
        await PaymentFactory.create<PaymentModel>(PaymentModel.name, {
          walletId,
          operationId,
          decodedQrCode: decodedQrCode,
          decodedPixAccount: decodedPixAccount,
        });

        const message: GetPaymentByOperationIdRequest = {
          operationId,
          walletId,
        };

        const result = await controller.execute(
          paymentRepository,
          decodedQrCodeRepository,
          decodedPixAccountRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.description).toBeDefined();
        expect(result.value.endToEndId).toBeDefined();
        expect(result.value.operationId).toBeDefined();
        expect(result.value.key).toBeDefined();
        expect(result.value.paymentDate).toBeDefined();
        expect(result.value.paymentType).toBeDefined();
        expect(result.value.state).toBeDefined();
        expect(result.value.transactionTag).toBeDefined();
        expect(result.value.txId).toBeDefined();
        expect(result.value.userId).toBeDefined();
        expect(result.value.ownerAccountNumber).toBeDefined();
        expect(result.value.ownerBranch).toBeDefined();
        expect(result.value.ownerDocument).toBeDefined();
        expect(result.value.ownerFullName).toBeDefined();
        expect(result.value.beneficiaryAccountNumber).toBeDefined();
        expect(result.value.beneficiaryAccountType).toBeDefined();
        expect(result.value.beneficiaryBankIspb).toBeDefined();
        expect(result.value.beneficiaryBankName).toBeDefined();
        expect(result.value.beneficiaryBranch).toBeDefined();
        expect(result.value.beneficiaryDocument).toBeDefined();
        expect(result.value.beneficiaryName).toBeDefined();
        expect(result.value.beneficiaryPersonType).toBeDefined();
        expect(result.value.createdAt).toBeDefined();
        expect(result.value.updatedAt).toBeDefined();
        expect(result.value.failed).toBeDefined();
      });

      it('TC0004 - Should get payments with operation and wallet not found', async () => {
        const walletId = uuidV4();
        const operationId = uuidV4();
        const decodedQrCode =
          await DecodedQrCodeFactory.create<DecodedQrCodeModel>(
            DecodedQrCodeModel.name,
          );
        const decodedPixAccount =
          await DecodedPixAccountFactory.create<DecodedPixAccountModel>(
            DecodedPixAccountModel.name,
          );
        await PaymentFactory.create<PaymentModel>(PaymentModel.name, {
          operationId,
          decodedQrCode: decodedQrCode,
          decodedPixAccount: decodedPixAccount,
        });

        const message: GetPaymentByOperationIdRequest = {
          operationId,
          walletId,
        };

        const result = await controller.execute(
          paymentRepository,
          decodedQrCodeRepository,
          decodedPixAccountRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeNull();
      });
    });

    describe('With invalid parameters', () => {
      it('TC0005 - Should throw error if send payment with object decodePixAccount empty', async () => {
        const operationId = uuidV4();
        await PaymentFactory.create<PaymentModel>(PaymentModel.name, {
          operationId,
          decodedPixAccount: new DecodedPixAccountEntity({ id: uuidV4() }),
          paymentType: PaymentType.ACCOUNT,
        });
        const message: GetPaymentByOperationIdRequest = {
          operationId,
        };

        const testScript = () =>
          controller.execute(
            paymentRepository,
            decodedQrCodeRepository,
            decodedPixAccountRepository,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(
          DecodedPixAccountNotFoundException,
        );
      });

      it('TC0006 - Should throw error if send payment with object decodeQrCode empty', async () => {
        const operationId = uuidV4();
        await PaymentFactory.create<PaymentModel>(PaymentModel.name, {
          operationId,
          decodedQrCode: new DecodedQrCodeEntity({ id: uuidV4() }),
          paymentType: PaymentType.QR_CODE,
        });
        const message: GetPaymentByOperationIdRequest = {
          operationId,
        };

        const testScript = () =>
          controller.execute(
            paymentRepository,
            decodedQrCodeRepository,
            decodedPixAccountRepository,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(
          DecodedQrCodeNotFoundException,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
