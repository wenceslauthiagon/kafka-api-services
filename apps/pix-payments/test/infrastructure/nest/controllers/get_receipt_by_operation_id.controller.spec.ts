import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { v4 as uuidV4 } from 'uuid';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import {
  formatCnpj,
  formatCpf,
  formatDateAndTime,
  formatToFloatValueReal,
  defaultLogger as logger,
} from '@zro/common';
import { PersonDocumentType } from '@zro/users/domain';
import {
  DecodedPixAccountEntity,
  DecodedPixAccountRepository,
  DecodedQrCodeEntity,
  DecodedQrCodeRepository,
  DecodedQrCodeType,
  PaymentEntity,
  PaymentRepository,
  PixDepositRepository,
  PixDevolutionRepository,
  PaymentState,
  PaymentType,
  PixDepositEntity,
  PixDevolutionEntity,
  PixDevolutionReceivedRepository,
  PixDevolutionReceivedEntity,
  PixDevolutionReceivedState,
  PixDepositState,
  WarningPixDevolutionRepository,
  WarningPixDevolutionEntity,
} from '@zro/pix-payments/domain';
import {
  PaymentNotFoundException,
  PixDepositNotFoundException,
} from '@zro/pix-payments/application';
import {
  GetReceiptByOperationIdRequest,
  ReceiptPortugueseTranslation,
} from '@zro/pix-payments/interface';
import { GetReceiptByOperationIdMicroserviceController as Controller } from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  DecodedPixAccountFactory,
  DecodedQrCodeFactory,
  PaymentFactory,
  PixDepositFactory,
  PixDevolutionFactory,
  PixDevolutionReceivedFactory,
  WarningPixDevolutionFactory,
} from '@zro/test/pix-payments/config';

describe('GetReceiptByOperationIdMicroservice Controller', () => {
  let module: TestingModule;
  let controller: Controller;

  const paymentRepositoryMock: PaymentRepository =
    createMock<PaymentRepository>();
  const mockGetPaymentByOperation: jest.Mock = On(paymentRepositoryMock).get(
    method((mock) => mock.getByOperation),
  );
  const mockGetPaymentById: jest.Mock = On(paymentRepositoryMock).get(
    method((mock) => mock.getById),
  );

  const depositRepositoryMock: PixDepositRepository =
    createMock<PixDepositRepository>();
  const mockGetDepositById: jest.Mock = On(depositRepositoryMock).get(
    method((mock) => mock.getById),
  );
  const mockGetDepositByOperation: jest.Mock = On(depositRepositoryMock).get(
    method((mock) => mock.getByOperation),
  );

  const devolutionRepositoryMock: PixDevolutionRepository =
    createMock<PixDevolutionRepository>();
  const mockGetDevolutionByOperation: jest.Mock = On(
    devolutionRepositoryMock,
  ).get(method((mock) => mock.getByOperation));

  const devolutionReceivedRepositoryMock: PixDevolutionReceivedRepository =
    createMock<PixDevolutionReceivedRepository>();
  const mockGetDevolutionReceivedByOperation: jest.Mock = On(
    devolutionReceivedRepositoryMock,
  ).get(method((mock) => mock.getByOperation));

  const decodedQrCodeRepositoryMock: DecodedQrCodeRepository =
    createMock<DecodedQrCodeRepository>();
  const mockGetDecodedQrCodeById: jest.Mock = On(
    decodedQrCodeRepositoryMock,
  ).get(method((mock) => mock.getById));

  const decodedPixAccountRepositoryMock: DecodedPixAccountRepository =
    createMock<DecodedPixAccountRepository>();
  const mockGetDecodedPixAccountById: jest.Mock = On(
    decodedPixAccountRepositoryMock,
  ).get(method((mock) => mock.getById));

  const warningPixDevolutionRepositoryMock: WarningPixDevolutionRepository =
    createMock<WarningPixDevolutionRepository>();
  const mockGetWarningPixDevolutionByOperation: jest.Mock = On(
    warningPixDevolutionRepositoryMock,
  ).get(method((mock) => mock.getByOperation));

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetReceiptByOperationIdMicroserviceController', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get an immediate pix key payment by operation id and create its receipt', async () => {
        const payment = await PaymentFactory.create<PaymentEntity>(
          PaymentEntity.name,
          { state: PaymentState.CONFIRMED, paymentType: PaymentType.KEY },
        );

        mockGetPaymentByOperation.mockResolvedValue(payment);

        const message: GetReceiptByOperationIdRequest = {
          operationId: uuidV4(),
          userId: payment.user.uuid,
          walletId: payment.wallet.uuid,
        };

        const result = await controller.execute(
          paymentRepositoryMock,
          depositRepositoryMock,
          devolutionRepositoryMock,
          devolutionReceivedRepositoryMock,
          decodedQrCodeRepositoryMock,
          decodedPixAccountRepositoryMock,
          warningPixDevolutionRepositoryMock,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.isScheduled).toBe(false);
        expect(result.value.activeDevolution).toBe(false);
        expect(result.value.operationId).toBe(payment.operation.id);
        expect(result.value.paymentTitle).toBe(
          ReceiptPortugueseTranslation.pixSent,
        );
        expect(result.value.paymentData).toMatchObject([
          {
            [ReceiptPortugueseTranslation.sendingData]: [
              { [ReceiptPortugueseTranslation.id]: payment.endToEndId },
              {
                [ReceiptPortugueseTranslation.sentValue]:
                  formatToFloatValueReal(payment.value),
              },
              {
                [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
                  payment.createdAt,
                  'DD/MM/YYYY - HH:mm:ss',
                ),
              },
              {
                [ReceiptPortugueseTranslation.description]:
                  payment.description ||
                  ReceiptPortugueseTranslation.noDescription,
              },
            ],
          },
          {
            [ReceiptPortugueseTranslation.recipientInfo]: [
              {
                [ReceiptPortugueseTranslation.institution]:
                  payment.beneficiaryBankName,
              },
              {
                [PersonDocumentType.CPF]: formatCpf(
                  payment.beneficiaryDocument,
                ),
              },
              { [ReceiptPortugueseTranslation.name]: payment.beneficiaryName },
            ],
          },
          {
            [ReceiptPortugueseTranslation.payerInfo]: [
              {
                [ReceiptPortugueseTranslation.institution]:
                  ReceiptPortugueseTranslation.zrobank,
              },
              { [ReceiptPortugueseTranslation.name]: payment.ownerFullName },
              { [PersonDocumentType.CNPJ]: formatCnpj(payment.ownerDocument) },
            ],
          },
        ]);

        expect(mockGetPaymentByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDepositByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionReceivedByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDecodedQrCodeById).toHaveBeenCalledTimes(0);
        expect(mockGetDecodedPixAccountById).toHaveBeenCalledTimes(0);
        expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(0);
      });

      it('TC0002 - Should get a scheduled pix key payment by operation id and create its receipt', async () => {
        const decodedPixAccount =
          await DecodedPixAccountFactory.create<DecodedPixAccountEntity>(
            DecodedPixAccountEntity.name,
          );
        const payment = await PaymentFactory.create<PaymentEntity>(
          PaymentEntity.name,
          { state: PaymentState.SCHEDULED, paymentType: PaymentType.ACCOUNT },
        );
        payment.decodedPixAccount = decodedPixAccount;

        mockGetPaymentByOperation.mockResolvedValue(payment);
        mockGetDecodedPixAccountById.mockResolvedValue(decodedPixAccount);

        const message: GetReceiptByOperationIdRequest = {
          operationId: uuidV4(),
          userId: payment.user.uuid,
          walletId: payment.wallet.uuid,
        };

        const result = await controller.execute(
          paymentRepositoryMock,
          depositRepositoryMock,
          devolutionRepositoryMock,
          devolutionReceivedRepositoryMock,
          decodedQrCodeRepositoryMock,
          decodedPixAccountRepositoryMock,
          warningPixDevolutionRepositoryMock,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.isScheduled).toBe(true);
        expect(result.value.activeDevolution).toBe(false);
        expect(result.value.operationId).toBe(payment.operation.id);
        expect(result.value.paymentTitle).toBe(
          ReceiptPortugueseTranslation.pixScheduled,
        );
        expect(result.value.paymentData).toMatchObject([
          {
            [ReceiptPortugueseTranslation.sendingData]: [
              { [ReceiptPortugueseTranslation.id]: payment.endToEndId },
              {
                [ReceiptPortugueseTranslation.dueDate]: formatDateAndTime(
                  payment.paymentDate,
                  'DD/MM/YYYY',
                ),
              },
              {
                [ReceiptPortugueseTranslation.sentValue]:
                  formatToFloatValueReal(payment.value),
              },
              {
                [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
                  payment.createdAt,
                  'DD/MM/YYYY - HH:mm:ss',
                ),
              },
              {
                [ReceiptPortugueseTranslation.description]:
                  payment.description ||
                  ReceiptPortugueseTranslation.noDescription,
              },
            ],
          },
          {
            [ReceiptPortugueseTranslation.recipientInfo]: [
              {
                [ReceiptPortugueseTranslation.institution]:
                  payment.beneficiaryBankName,
              },
              {
                [PersonDocumentType.CPF]: formatCpf(
                  payment.beneficiaryDocument,
                ),
              },
              { [ReceiptPortugueseTranslation.name]: payment.beneficiaryName },
            ],
          },
          {
            [ReceiptPortugueseTranslation.payerInfo]: [
              {
                [ReceiptPortugueseTranslation.institution]:
                  ReceiptPortugueseTranslation.zrobank,
              },
              { [ReceiptPortugueseTranslation.name]: payment.ownerFullName },
              { [PersonDocumentType.CNPJ]: formatCnpj(payment.ownerDocument) },
            ],
          },
        ]);

        expect(mockGetPaymentByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDepositByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionReceivedByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDecodedQrCodeById).toHaveBeenCalledTimes(0);
        expect(mockGetDecodedPixAccountById).toHaveBeenCalledTimes(1);
        expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should get an immediate by account payment by operation id and create its receipt', async () => {
        const decodedPixAccount =
          await DecodedPixAccountFactory.create<DecodedPixAccountEntity>(
            DecodedPixAccountEntity.name,
          );

        const payment = await PaymentFactory.create<PaymentEntity>(
          PaymentEntity.name,
          { state: PaymentState.CONFIRMED, paymentType: PaymentType.ACCOUNT },
        );
        payment.decodedPixAccount = decodedPixAccount;

        mockGetPaymentByOperation.mockResolvedValue(payment);
        mockGetDecodedPixAccountById.mockResolvedValue(decodedPixAccount);

        const message: GetReceiptByOperationIdRequest = {
          operationId: uuidV4(),
          userId: payment.user.uuid,
          walletId: payment.wallet.uuid,
        };

        const result = await controller.execute(
          paymentRepositoryMock,
          depositRepositoryMock,
          devolutionRepositoryMock,
          devolutionReceivedRepositoryMock,
          decodedQrCodeRepositoryMock,
          decodedPixAccountRepositoryMock,
          warningPixDevolutionRepositoryMock,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.isScheduled).toBe(false);
        expect(result.value.activeDevolution).toBe(false);
        expect(result.value.operationId).toBe(payment.operation.id);
        expect(result.value.paymentTitle).toBe(
          ReceiptPortugueseTranslation.pixSent,
        );
        expect(result.value.paymentData).toMatchObject([
          {
            [ReceiptPortugueseTranslation.sendingData]: [
              { [ReceiptPortugueseTranslation.id]: payment.endToEndId },
              {
                [ReceiptPortugueseTranslation.sentValue]:
                  formatToFloatValueReal(payment.value),
              },
              {
                [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
                  payment.createdAt,
                  'DD/MM/YYYY - HH:mm:ss',
                ),
              },
              {
                [ReceiptPortugueseTranslation.description]:
                  payment.description ||
                  ReceiptPortugueseTranslation.noDescription,
              },
            ],
          },
          {
            [ReceiptPortugueseTranslation.recipientInfo]: [
              {
                [ReceiptPortugueseTranslation.institution]:
                  payment.beneficiaryBankName,
              },
              {
                [PersonDocumentType.CPF]: formatCpf(
                  payment.beneficiaryDocument,
                ),
              },
              { [ReceiptPortugueseTranslation.name]: payment.beneficiaryName },
            ],
          },
          {
            [ReceiptPortugueseTranslation.payerInfo]: [
              {
                [ReceiptPortugueseTranslation.institution]:
                  ReceiptPortugueseTranslation.zrobank,
              },
              { [ReceiptPortugueseTranslation.name]: payment.ownerFullName },
              { [PersonDocumentType.CNPJ]: formatCnpj(payment.ownerDocument) },
            ],
          },
        ]);

        expect(mockGetPaymentByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDepositByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionReceivedByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDecodedQrCodeById).toHaveBeenCalledTimes(0);
        expect(mockGetDecodedPixAccountById).toHaveBeenCalledTimes(1);
        expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(0);
      });

      it('TC0004 - Should get a scheduled by account payment by operation id and create its receipt', async () => {
        const decodedPixAccount =
          await DecodedPixAccountFactory.create<DecodedPixAccountEntity>(
            DecodedPixAccountEntity.name,
          );

        const payment = await PaymentFactory.create<PaymentEntity>(
          PaymentEntity.name,
          {
            state: PaymentState.SCHEDULED,
            paymentType: PaymentType.ACCOUNT,
          },
        );
        payment.decodedPixAccount = decodedPixAccount;

        mockGetPaymentByOperation.mockResolvedValue(payment);
        mockGetDecodedPixAccountById.mockResolvedValue(decodedPixAccount);

        const message: GetReceiptByOperationIdRequest = {
          operationId: uuidV4(),
          userId: payment.user.uuid,
          walletId: payment.wallet.uuid,
        };

        const result = await controller.execute(
          paymentRepositoryMock,
          depositRepositoryMock,
          devolutionRepositoryMock,
          devolutionReceivedRepositoryMock,
          decodedQrCodeRepositoryMock,
          decodedPixAccountRepositoryMock,
          warningPixDevolutionRepositoryMock,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.isScheduled).toBe(true);
        expect(result.value.activeDevolution).toBe(false);
        expect(result.value.operationId).toBe(payment.operation.id);
        expect(result.value.paymentTitle).toBe(
          ReceiptPortugueseTranslation.pixScheduled,
        );
        expect(result.value.paymentData).toMatchObject([
          {
            [ReceiptPortugueseTranslation.sendingData]: [
              { [ReceiptPortugueseTranslation.id]: payment.endToEndId },
              {
                [ReceiptPortugueseTranslation.dueDate]: formatDateAndTime(
                  payment.paymentDate,
                  'DD/MM/YYYY',
                ),
              },
              {
                [ReceiptPortugueseTranslation.sentValue]:
                  formatToFloatValueReal(payment.value),
              },
              {
                [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
                  payment.createdAt,
                  'DD/MM/YYYY - HH:mm:ss',
                ),
              },
              {
                [ReceiptPortugueseTranslation.description]:
                  payment.description ||
                  ReceiptPortugueseTranslation.noDescription,
              },
            ],
          },
          {
            [ReceiptPortugueseTranslation.recipientInfo]: [
              {
                [ReceiptPortugueseTranslation.institution]:
                  payment.beneficiaryBankName,
              },
              {
                [PersonDocumentType.CPF]: formatCpf(
                  payment.beneficiaryDocument,
                ),
              },
              { [ReceiptPortugueseTranslation.name]: payment.beneficiaryName },
            ],
          },
          {
            [ReceiptPortugueseTranslation.payerInfo]: [
              {
                [ReceiptPortugueseTranslation.institution]:
                  ReceiptPortugueseTranslation.zrobank,
              },
              { [ReceiptPortugueseTranslation.name]: payment.ownerFullName },
              { [PersonDocumentType.CNPJ]: formatCnpj(payment.ownerDocument) },
            ],
          },
        ]);

        expect(mockGetPaymentByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDecodedPixAccountById).toHaveBeenCalledTimes(1);
        expect(mockGetDepositByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionReceivedByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDecodedQrCodeById).toHaveBeenCalledTimes(0);
        expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(0);
      });

      it('TC0005 - Should get an immediate static QR code payment by operation id and create its receipt', async () => {
        const decodedQrCode =
          await DecodedQrCodeFactory.create<DecodedQrCodeEntity>(
            DecodedQrCodeEntity.name,
          );

        const payment = await PaymentFactory.create<PaymentEntity>(
          PaymentEntity.name,
          { state: PaymentState.CONFIRMED, paymentType: PaymentType.QR_CODE },
        );
        payment.decodedQrCode = decodedQrCode;

        mockGetPaymentByOperation.mockResolvedValue(payment);
        mockGetDecodedQrCodeById.mockResolvedValue(decodedQrCode);

        const message: GetReceiptByOperationIdRequest = {
          operationId: uuidV4(),
          userId: payment.user.uuid,
          walletId: payment.wallet.uuid,
        };

        const result = await controller.execute(
          paymentRepositoryMock,
          depositRepositoryMock,
          devolutionRepositoryMock,
          devolutionReceivedRepositoryMock,
          decodedQrCodeRepositoryMock,
          decodedPixAccountRepositoryMock,
          warningPixDevolutionRepositoryMock,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.isScheduled).toBe(false);
        expect(result.value.activeDevolution).toBe(false);
        expect(result.value.operationId).toBe(payment.operation.id);
        expect(result.value.paymentTitle).toBe(
          ReceiptPortugueseTranslation.pixSent,
        );
        expect(result.value.paymentData).toMatchObject([
          {
            [ReceiptPortugueseTranslation.sendingData]: [
              { [ReceiptPortugueseTranslation.id]: payment.endToEndId },
              {
                [ReceiptPortugueseTranslation.sentValue]:
                  formatToFloatValueReal(payment.value),
              },
              {
                [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
                  payment.createdAt,
                  'DD/MM/YYYY - HH:mm:ss',
                ),
              },
            ],
          },
          {
            [ReceiptPortugueseTranslation.recipientInfo]: [
              {
                [ReceiptPortugueseTranslation.institution]:
                  payment.beneficiaryBankName,
              },
              {
                [PersonDocumentType.CPF]: formatCpf(
                  payment.beneficiaryDocument,
                ),
              },
              { [ReceiptPortugueseTranslation.name]: payment.beneficiaryName },
            ],
          },
          {
            [ReceiptPortugueseTranslation.payerInfo]: [
              {
                [ReceiptPortugueseTranslation.institution]:
                  ReceiptPortugueseTranslation.zrobank,
              },
              { [ReceiptPortugueseTranslation.name]: payment.ownerFullName },
              { [PersonDocumentType.CNPJ]: formatCnpj(payment.ownerDocument) },
            ],
          },
        ]);

        expect(mockGetPaymentByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDecodedQrCodeById).toHaveBeenCalledTimes(1);
        expect(mockGetDepositByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionReceivedByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDecodedPixAccountById).toHaveBeenCalledTimes(0);
        expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(0);
      });

      it('TC0006 - Should get a scheduled static QR code payment by operation id and create its receipt', async () => {
        const decodedQrCode =
          await DecodedQrCodeFactory.create<DecodedQrCodeEntity>(
            DecodedQrCodeEntity.name,
          );

        const payment = await PaymentFactory.create<PaymentEntity>(
          PaymentEntity.name,
          {
            state: PaymentState.SCHEDULED,
            paymentType: PaymentType.QR_CODE,
            endToEndId: null,
          },
        );
        payment.decodedQrCode = decodedQrCode;

        mockGetPaymentByOperation.mockResolvedValue(payment);
        mockGetDecodedQrCodeById.mockResolvedValue(decodedQrCode);

        const message: GetReceiptByOperationIdRequest = {
          operationId: uuidV4(),
          userId: payment.user.uuid,
          walletId: payment.wallet.uuid,
        };

        const result = await controller.execute(
          paymentRepositoryMock,
          depositRepositoryMock,
          devolutionRepositoryMock,
          devolutionReceivedRepositoryMock,
          decodedQrCodeRepositoryMock,
          decodedPixAccountRepositoryMock,
          warningPixDevolutionRepositoryMock,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.isScheduled).toBe(true);
        expect(result.value.activeDevolution).toBe(false);
        expect(result.value.operationId).toBe(payment.operation.id);
        expect(result.value.paymentTitle).toBe(
          ReceiptPortugueseTranslation.pixScheduled,
        );
        expect(result.value.paymentData).toMatchObject([
          {
            [ReceiptPortugueseTranslation.sendingData]: [
              {
                [ReceiptPortugueseTranslation.dueDate]: formatDateAndTime(
                  payment.paymentDate,
                  'DD/MM/YYYY',
                ),
              },
              {
                [ReceiptPortugueseTranslation.sentValue]:
                  formatToFloatValueReal(payment.value),
              },
              {
                [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
                  payment.createdAt,
                  'DD/MM/YYYY - HH:mm:ss',
                ),
              },
            ],
          },
          {
            [ReceiptPortugueseTranslation.recipientInfo]: [
              {
                [ReceiptPortugueseTranslation.institution]:
                  payment.beneficiaryBankName,
              },
              {
                [PersonDocumentType.CPF]: formatCpf(
                  payment.beneficiaryDocument,
                ),
              },
              { [ReceiptPortugueseTranslation.name]: payment.beneficiaryName },
            ],
          },
          {
            [ReceiptPortugueseTranslation.payerInfo]: [
              {
                [ReceiptPortugueseTranslation.institution]:
                  ReceiptPortugueseTranslation.zrobank,
              },
              { [ReceiptPortugueseTranslation.name]: payment.ownerFullName },
              { [PersonDocumentType.CNPJ]: formatCnpj(payment.ownerDocument) },
            ],
          },
        ]);

        expect(mockGetPaymentByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDecodedQrCodeById).toHaveBeenCalledTimes(1);
        expect(mockGetDepositByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionReceivedByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDecodedPixAccountById).toHaveBeenCalledTimes(0);
        expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(0);
      });

      it('TC0007 - Should get a static QR code withdrawal payment by operation id and create its receipt', async () => {
        const decodedQrCode =
          await DecodedQrCodeFactory.create<DecodedQrCodeEntity>(
            DecodedQrCodeEntity.name,
            { type: DecodedQrCodeType.QR_CODE_STATIC_WITHDRAWAL },
          );

        const payment = await PaymentFactory.create<PaymentEntity>(
          PaymentEntity.name,
          { state: PaymentState.CONFIRMED, paymentType: PaymentType.QR_CODE },
        );
        payment.decodedQrCode = decodedQrCode;

        mockGetPaymentByOperation.mockResolvedValue(payment);
        mockGetDecodedQrCodeById.mockResolvedValue(decodedQrCode);

        const message: GetReceiptByOperationIdRequest = {
          operationId: uuidV4(),
          userId: payment.user.uuid,
          walletId: payment.wallet.uuid,
        };

        const result = await controller.execute(
          paymentRepositoryMock,
          depositRepositoryMock,
          devolutionRepositoryMock,
          devolutionReceivedRepositoryMock,
          decodedQrCodeRepositoryMock,
          decodedPixAccountRepositoryMock,
          warningPixDevolutionRepositoryMock,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.isScheduled).toBe(false);
        expect(result.value.activeDevolution).toBe(false);
        expect(result.value.operationId).toBe(payment.operation.id);
        expect(result.value.paymentTitle).toBe(
          ReceiptPortugueseTranslation.pixDraw,
        );
        expect(result.value.paymentData).toMatchObject([
          {
            [ReceiptPortugueseTranslation.sendingData]: [
              { [ReceiptPortugueseTranslation.id]: payment.endToEndId },
              {
                [ReceiptPortugueseTranslation.sentValue]:
                  formatToFloatValueReal(payment.value),
              },
              {
                [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
                  payment.createdAt,
                  'DD/MM/YYYY - HH:mm:ss',
                ),
              },
            ],
          },
          {
            [ReceiptPortugueseTranslation.recipientInfo]: [
              {
                [ReceiptPortugueseTranslation.institution]:
                  payment.beneficiaryBankName,
              },
              {
                [PersonDocumentType.CPF]: formatCpf(
                  payment.beneficiaryDocument,
                ),
              },
              { [ReceiptPortugueseTranslation.name]: payment.beneficiaryName },
            ],
          },
          {
            [ReceiptPortugueseTranslation.drawerInfo]: [
              { [ReceiptPortugueseTranslation.name]: payment.ownerFullName },
              { [PersonDocumentType.CNPJ]: formatCnpj(payment.ownerDocument) },
            ],
          },
        ]);

        expect(mockGetPaymentByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDecodedQrCodeById).toHaveBeenCalledTimes(1);
        expect(mockGetDepositByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionReceivedByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDecodedPixAccountById).toHaveBeenCalledTimes(0);
        expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(0);
      });

      it('TC0008 - Should get by dynamic QR code withdrawal payment by operation id and create its receipt', async () => {
        const decodedQrCode =
          await DecodedQrCodeFactory.create<DecodedQrCodeEntity>(
            DecodedQrCodeEntity.name,
            { type: DecodedQrCodeType.QR_CODE_DYNAMIC_WITHDRAWAL },
          );

        const payment = await PaymentFactory.create<PaymentEntity>(
          PaymentEntity.name,
          { state: PaymentState.CONFIRMED, paymentType: PaymentType.QR_CODE },
        );
        payment.decodedQrCode = decodedQrCode;

        mockGetPaymentByOperation.mockResolvedValue(payment);
        mockGetDecodedQrCodeById.mockResolvedValue(decodedQrCode);

        const message: GetReceiptByOperationIdRequest = {
          operationId: uuidV4(),
          userId: payment.user.uuid,
          walletId: payment.wallet.uuid,
        };

        const result = await controller.execute(
          paymentRepositoryMock,
          depositRepositoryMock,
          devolutionRepositoryMock,
          devolutionReceivedRepositoryMock,
          decodedQrCodeRepositoryMock,
          decodedPixAccountRepositoryMock,
          warningPixDevolutionRepositoryMock,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.isScheduled).toBe(false);
        expect(result.value.activeDevolution).toBe(false);
        expect(result.value.operationId).toBe(payment.operation.id);
        expect(result.value.paymentTitle).toBe(
          ReceiptPortugueseTranslation.pixDraw,
        );
        expect(result.value.paymentData).toMatchObject([
          {
            [ReceiptPortugueseTranslation.sendingData]: [
              { [ReceiptPortugueseTranslation.id]: payment.endToEndId },
              {
                [ReceiptPortugueseTranslation.sentValue]:
                  formatToFloatValueReal(payment.value),
              },
              {
                [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
                  payment.createdAt,
                  'DD/MM/YYYY - HH:mm:ss',
                ),
              },
            ],
          },
          {
            [ReceiptPortugueseTranslation.recipientInfo]: [
              {
                [ReceiptPortugueseTranslation.institution]:
                  payment.beneficiaryBankName,
              },
              {
                [PersonDocumentType.CPF]: formatCpf(
                  payment.beneficiaryDocument,
                ),
              },
              { [ReceiptPortugueseTranslation.name]: payment.beneficiaryName },
            ],
          },
          {
            [ReceiptPortugueseTranslation.drawerInfo]: [
              { [ReceiptPortugueseTranslation.name]: payment.ownerFullName },
              { [PersonDocumentType.CNPJ]: formatCnpj(payment.ownerDocument) },
            ],
          },
        ]);

        expect(mockGetPaymentByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDecodedQrCodeById).toHaveBeenCalledTimes(1);
        expect(mockGetDepositByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionReceivedByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDecodedPixAccountById).toHaveBeenCalledTimes(0);
        expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(0);
      });

      it('TC0009 - Should get by dynamic QR code change payment by operation id and create its receipt', async () => {
        const decodedQrCode =
          await DecodedQrCodeFactory.create<DecodedQrCodeEntity>(
            DecodedQrCodeEntity.name,
            { type: DecodedQrCodeType.QR_CODE_DYNAMIC_CHANGE },
          );

        const payment = await PaymentFactory.create<PaymentEntity>(
          PaymentEntity.name,
          { state: PaymentState.CONFIRMED, paymentType: PaymentType.QR_CODE },
        );
        payment.decodedQrCode = decodedQrCode;

        mockGetPaymentByOperation.mockResolvedValue(payment);
        mockGetDecodedQrCodeById.mockResolvedValue(decodedQrCode);

        const message: GetReceiptByOperationIdRequest = {
          operationId: uuidV4(),
          userId: payment.user.uuid,
          walletId: payment.wallet.uuid,
        };

        const result = await controller.execute(
          paymentRepositoryMock,
          depositRepositoryMock,
          devolutionRepositoryMock,
          devolutionReceivedRepositoryMock,
          decodedQrCodeRepositoryMock,
          decodedPixAccountRepositoryMock,
          warningPixDevolutionRepositoryMock,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.isScheduled).toBe(false);
        expect(result.value.activeDevolution).toBe(false);
        expect(result.value.operationId).toBe(payment.operation.id);
        expect(result.value.paymentTitle).toBe(
          ReceiptPortugueseTranslation.pixChange,
        );
        expect(result.value.paymentData).toMatchObject([
          {
            [ReceiptPortugueseTranslation.sendingData]: [
              { [ReceiptPortugueseTranslation.id]: payment.endToEndId },
              {
                [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
                  payment.createdAt,
                  'DD/MM/YYYY - HH:mm:ss',
                ),
              },
              {
                [ReceiptPortugueseTranslation.purchaseValue]:
                  formatToFloatValueReal(payment.decodedQrCode.documentValue),
              },
              {
                [ReceiptPortugueseTranslation.changeValue]:
                  formatToFloatValueReal(
                    payment.value - payment.decodedQrCode.documentValue,
                  ),
              },
              {
                [ReceiptPortugueseTranslation.finalValue]:
                  formatToFloatValueReal(payment.value),
              },
            ],
          },
          {
            [ReceiptPortugueseTranslation.recipientInfo]: [
              {
                [ReceiptPortugueseTranslation.institution]:
                  payment.beneficiaryBankName,
              },
              {
                [PersonDocumentType.CPF]: formatCpf(
                  payment.beneficiaryDocument,
                ),
              },
              { [ReceiptPortugueseTranslation.name]: payment.beneficiaryName },
            ],
          },
          {
            [ReceiptPortugueseTranslation.drawerInfo]: [
              { [ReceiptPortugueseTranslation.name]: payment.ownerFullName },
              { [PersonDocumentType.CNPJ]: formatCnpj(payment.ownerDocument) },
            ],
          },
        ]);

        expect(mockGetPaymentByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDecodedQrCodeById).toHaveBeenCalledTimes(1);
        expect(mockGetDepositByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionReceivedByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDecodedPixAccountById).toHaveBeenCalledTimes(0);
        expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(0);
      });

      it('TC0010 - Should get by dynamic QR code with due date payment by operation id and create its receipt', async () => {
        const decodedQrCode =
          await DecodedQrCodeFactory.create<DecodedQrCodeEntity>(
            DecodedQrCodeEntity.name,
            {
              type: DecodedQrCodeType.QR_CODE_DYNAMIC_DUE_DATE,
              additionalInfos: [{ name: 'Entrega', value: 'Residencial' }],
            },
          );

        const payment = await PaymentFactory.create<PaymentEntity>(
          PaymentEntity.name,
          { state: PaymentState.SCHEDULED, paymentType: PaymentType.QR_CODE },
        );
        payment.decodedQrCode = decodedQrCode;

        mockGetPaymentByOperation.mockResolvedValue(payment);
        mockGetDecodedQrCodeById.mockResolvedValue(decodedQrCode);

        const message: GetReceiptByOperationIdRequest = {
          operationId: uuidV4(),
          userId: payment.user.uuid,
          walletId: payment.wallet.uuid,
        };

        const result = await controller.execute(
          paymentRepositoryMock,
          depositRepositoryMock,
          devolutionRepositoryMock,
          devolutionReceivedRepositoryMock,
          decodedQrCodeRepositoryMock,
          decodedPixAccountRepositoryMock,
          warningPixDevolutionRepositoryMock,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.isScheduled).toBe(true);
        expect(result.value.activeDevolution).toBe(false);
        expect(result.value.operationId).toBe(payment.operation.id);
        expect(result.value.paymentTitle).toBe(
          ReceiptPortugueseTranslation.pixScheduled,
        );
        expect(result.value.paymentData).toMatchObject([
          {
            [ReceiptPortugueseTranslation.sendingData]: [
              {
                [ReceiptPortugueseTranslation.dueDate]: formatDateAndTime(
                  payment.paymentDate,
                  'DD/MM/YYYY',
                ),
              },
              {
                [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
                  payment.createdAt,
                  'DD/MM/YYYY - HH:mm:ss',
                ),
              },
              {
                [ReceiptPortugueseTranslation.originalValue]:
                  formatToFloatValueReal(payment.decodedQrCode.documentValue),
              },
              {
                [ReceiptPortugueseTranslation.deductionValue]:
                  formatToFloatValueReal(payment.decodedQrCode.deductionValue),
              },
              {
                [ReceiptPortugueseTranslation.discountValue]:
                  formatToFloatValueReal(payment.decodedQrCode.discountValue),
              },
              {
                [ReceiptPortugueseTranslation.feeValue]: formatToFloatValueReal(
                  payment.decodedQrCode.interestValue,
                ),
              },
              {
                [ReceiptPortugueseTranslation.fineValue]:
                  formatToFloatValueReal(payment.decodedQrCode.fineValue),
              },
              {
                [ReceiptPortugueseTranslation.finalValue]:
                  formatToFloatValueReal(payment.decodedQrCode.paymentValue),
              },
              {
                [ReceiptPortugueseTranslation.description]:
                  payment.description ||
                  ReceiptPortugueseTranslation.noDescription,
              },
            ],
          },
          {
            [ReceiptPortugueseTranslation.recipientInfo]: [
              {
                [ReceiptPortugueseTranslation.institution]:
                  payment.beneficiaryBankName,
              },
              { [ReceiptPortugueseTranslation.name]: payment.beneficiaryName },
              {
                [PersonDocumentType.CPF]: formatCpf(
                  payment.beneficiaryDocument,
                ),
              },
            ],
          },
          {
            [ReceiptPortugueseTranslation.payerInfo]: [
              {
                [ReceiptPortugueseTranslation.institution]:
                  ReceiptPortugueseTranslation.zrobank,
              },
              { [ReceiptPortugueseTranslation.name]: payment.ownerFullName },
              { [PersonDocumentType.CNPJ]: formatCnpj(payment.ownerDocument) },
            ],
          },
          {
            [ReceiptPortugueseTranslation.debtorInfo]: [
              {
                [ReceiptPortugueseTranslation.name]:
                  payment.decodedQrCode.payerName,
              },
              {
                [PersonDocumentType.CPF]: formatCpf(
                  payment.decodedQrCode.payerDocument,
                ),
              },
            ],
          },
          {
            [ReceiptPortugueseTranslation.additionalInfo]: [
              {
                [payment.decodedQrCode.additionalInfos[0].name]:
                  payment.decodedQrCode.additionalInfos[0].value,
              },
            ],
          },
        ]);

        expect(mockGetPaymentByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDecodedQrCodeById).toHaveBeenCalledTimes(1);
        expect(mockGetDepositByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionReceivedByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDecodedPixAccountById).toHaveBeenCalledTimes(0);
        expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(0);
      });

      it('TC0011 - Should get an immediate dynamic QR code payment by operation id and create its receipt', async () => {
        const decodedQrCode =
          await DecodedQrCodeFactory.create<DecodedQrCodeEntity>(
            DecodedQrCodeEntity.name,
            { type: DecodedQrCodeType.QR_CODE_DYNAMIC_INSTANT_PAYMENT },
          );

        const payment = await PaymentFactory.create<PaymentEntity>(
          PaymentEntity.name,
          { state: PaymentState.CONFIRMED, paymentType: PaymentType.QR_CODE },
        );
        payment.decodedQrCode = decodedQrCode;

        mockGetPaymentByOperation.mockResolvedValue(payment);
        mockGetDecodedQrCodeById.mockResolvedValue(decodedQrCode);

        const message: GetReceiptByOperationIdRequest = {
          operationId: uuidV4(),
          userId: payment.user.uuid,
          walletId: payment.wallet.uuid,
        };

        const result = await controller.execute(
          paymentRepositoryMock,
          depositRepositoryMock,
          devolutionRepositoryMock,
          devolutionReceivedRepositoryMock,
          decodedQrCodeRepositoryMock,
          decodedPixAccountRepositoryMock,
          warningPixDevolutionRepositoryMock,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.isScheduled).toBe(false);
        expect(result.value.activeDevolution).toBe(false);
        expect(result.value.operationId).toBe(payment.operation.id);
        expect(result.value.paymentTitle).toBe(
          ReceiptPortugueseTranslation.pixSent,
        );
        expect(result.value.paymentData).toMatchObject([
          {
            [ReceiptPortugueseTranslation.sendingData]: [
              { [ReceiptPortugueseTranslation.id]: payment.endToEndId },
              {
                [ReceiptPortugueseTranslation.sentValue]:
                  formatToFloatValueReal(payment.value),
              },
              {
                [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
                  payment.createdAt,
                  'DD/MM/YYYY - HH:mm:ss',
                ),
              },
            ],
          },
          {
            [ReceiptPortugueseTranslation.recipientInfo]: [
              {
                [ReceiptPortugueseTranslation.institution]:
                  payment.beneficiaryBankName,
              },
              {
                [PersonDocumentType.CPF]: formatCpf(
                  payment.beneficiaryDocument,
                ),
              },
              { [ReceiptPortugueseTranslation.name]: payment.beneficiaryName },
            ],
          },
          {
            [ReceiptPortugueseTranslation.debtorInfo]: [
              {
                [ReceiptPortugueseTranslation.name]:
                  payment.decodedQrCode.payerName,
              },
              {
                [PersonDocumentType.CPF]: formatCpf(
                  payment.decodedQrCode.payerDocument,
                ),
              },
            ],
          },
          {
            [ReceiptPortugueseTranslation.payerInfo]: [
              {
                [ReceiptPortugueseTranslation.institution]:
                  ReceiptPortugueseTranslation.zrobank,
              },
              { [ReceiptPortugueseTranslation.name]: payment.ownerFullName },
              { [PersonDocumentType.CNPJ]: formatCnpj(payment.ownerDocument) },
            ],
          },
        ]);

        expect(mockGetPaymentByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDepositByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionReceivedByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDecodedQrCodeById).toHaveBeenCalledTimes(1);
        expect(mockGetDecodedPixAccountById).toHaveBeenCalledTimes(0);
        expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(0);
      });

      it('TC0012 - Should get a scheduled dynamic QR code payment by operation id and create its receipt', async () => {
        const decodedQrCode =
          await DecodedQrCodeFactory.create<DecodedQrCodeEntity>(
            DecodedQrCodeEntity.name,
            { type: DecodedQrCodeType.QR_CODE_DYNAMIC_INSTANT_PAYMENT },
          );

        const payment = await PaymentFactory.create<PaymentEntity>(
          PaymentEntity.name,
          {
            state: PaymentState.SCHEDULED,
            paymentType: PaymentType.QR_CODE,
            endToEndId: null,
          },
        );
        payment.decodedQrCode = decodedQrCode;

        mockGetPaymentByOperation.mockResolvedValue(payment);
        mockGetDecodedQrCodeById.mockResolvedValue(decodedQrCode);

        const message: GetReceiptByOperationIdRequest = {
          operationId: uuidV4(),
          userId: payment.user.uuid,
          walletId: payment.wallet.uuid,
        };

        const result = await controller.execute(
          paymentRepositoryMock,
          depositRepositoryMock,
          devolutionRepositoryMock,
          devolutionReceivedRepositoryMock,
          decodedQrCodeRepositoryMock,
          decodedPixAccountRepositoryMock,
          warningPixDevolutionRepositoryMock,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.isScheduled).toBe(true);
        expect(result.value.activeDevolution).toBe(false);
        expect(result.value.operationId).toBe(payment.operation.id);
        expect(result.value.paymentTitle).toBe(
          ReceiptPortugueseTranslation.pixScheduled,
        );
        expect(result.value.paymentData).toMatchObject([
          {
            [ReceiptPortugueseTranslation.sendingData]: [
              {
                [ReceiptPortugueseTranslation.dueDate]: formatDateAndTime(
                  payment.paymentDate,
                  'DD/MM/YYYY',
                ),
              },
              {
                [ReceiptPortugueseTranslation.sentValue]:
                  formatToFloatValueReal(payment.value),
              },
              {
                [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
                  payment.createdAt,
                  'DD/MM/YYYY - HH:mm:ss',
                ),
              },
            ],
          },
          {
            [ReceiptPortugueseTranslation.recipientInfo]: [
              {
                [ReceiptPortugueseTranslation.institution]:
                  payment.beneficiaryBankName,
              },
              {
                [PersonDocumentType.CPF]: formatCpf(
                  payment.beneficiaryDocument,
                ),
              },
              { [ReceiptPortugueseTranslation.name]: payment.beneficiaryName },
            ],
          },
          {
            [ReceiptPortugueseTranslation.debtorInfo]: [
              {
                [ReceiptPortugueseTranslation.name]:
                  payment.decodedQrCode.payerName,
              },
              {
                [PersonDocumentType.CPF]: formatCpf(
                  payment.decodedQrCode.payerDocument,
                ),
              },
            ],
          },
          {
            [ReceiptPortugueseTranslation.payerInfo]: [
              {
                [ReceiptPortugueseTranslation.institution]:
                  ReceiptPortugueseTranslation.zrobank,
              },
              { [ReceiptPortugueseTranslation.name]: payment.ownerFullName },
              { [PersonDocumentType.CNPJ]: formatCnpj(payment.ownerDocument) },
            ],
          },
        ]);

        expect(mockGetPaymentByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDepositByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionReceivedByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(0);
      });

      it('TC0013 - Should get a pix deposit receipt', async () => {
        const deposit = await PixDepositFactory.create<PixDepositEntity>(
          PixDepositEntity.name,
          { createdAt: new Date() },
        );

        mockGetPaymentByOperation.mockResolvedValue(null);
        mockGetDepositByOperation.mockResolvedValue(deposit);

        const message: GetReceiptByOperationIdRequest = {
          operationId: uuidV4(),
          userId: deposit.user.uuid,
          walletId: deposit.wallet.uuid,
        };

        const result = await controller.execute(
          paymentRepositoryMock,
          depositRepositoryMock,
          devolutionRepositoryMock,
          devolutionReceivedRepositoryMock,
          decodedQrCodeRepositoryMock,
          decodedPixAccountRepositoryMock,
          warningPixDevolutionRepositoryMock,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.isScheduled).toBe(false);
        expect(result.value.activeDevolution).toBe(true);
        expect(result.value.operationId).toBe(deposit.operation.id);
        expect(result.value.paymentTitle).toBe(
          ReceiptPortugueseTranslation.pixReceived,
        );
        expect(result.value.paymentData).toMatchObject([
          {
            [ReceiptPortugueseTranslation.depositInfo]: [
              {
                [ReceiptPortugueseTranslation.id]: deposit.endToEndId,
              },
              {
                [ReceiptPortugueseTranslation.valueReceived]:
                  formatToFloatValueReal(deposit.amount),
              },
              {
                [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
                  deposit.createdAt,
                  'DD/MM/YYYY - HH:mm:ss',
                ),
              },
              {
                [ReceiptPortugueseTranslation.description]: deposit.description,
              },
            ],
          },
          {
            [ReceiptPortugueseTranslation.payerInfo]: [
              {
                [ReceiptPortugueseTranslation.institution]:
                  deposit.thirdPartBank.name,
              },
              {
                [PersonDocumentType.CPF]: formatCpf(deposit.thirdPartDocument),
              },
              { [ReceiptPortugueseTranslation.name]: deposit.thirdPartName },
            ],
          },
        ]);

        expect(mockGetPaymentByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDepositByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDevolutionByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionReceivedByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDecodedQrCodeById).toHaveBeenCalledTimes(0);
        expect(mockGetDecodedPixAccountById).toHaveBeenCalledTimes(0);
        expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(0);
      });

      it('TC0014 - Should get a pix devolution receipt', async () => {
        const deposit = await PixDepositFactory.create<PixDepositEntity>(
          PixDepositEntity.name,
        );
        const devolution =
          await PixDevolutionFactory.create<PixDevolutionEntity>(
            PixDevolutionEntity.name,
            { endToEndId: uuidV4(), createdAt: new Date() },
          );

        mockGetPaymentByOperation.mockResolvedValue(null);
        mockGetDepositByOperation.mockResolvedValue(null);
        mockGetDevolutionByOperation.mockResolvedValue(devolution);
        mockGetDepositById.mockResolvedValue(deposit);

        const message: GetReceiptByOperationIdRequest = {
          operationId: uuidV4(),
          userId: devolution.user.uuid,
          walletId: devolution.wallet.uuid,
        };

        const result = await controller.execute(
          paymentRepositoryMock,
          depositRepositoryMock,
          devolutionRepositoryMock,
          devolutionReceivedRepositoryMock,
          decodedQrCodeRepositoryMock,
          decodedPixAccountRepositoryMock,
          warningPixDevolutionRepositoryMock,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.isScheduled).toBe(false);
        expect(result.value.activeDevolution).toBe(false);
        expect(result.value.operationId).toBe(devolution.operation.id);
        expect(result.value.paymentTitle).toBe(
          ReceiptPortugueseTranslation.pixReturned,
        );
        expect(result.value.paymentData).toMatchObject([
          {
            [ReceiptPortugueseTranslation.devolutionInfo]: [
              {
                [ReceiptPortugueseTranslation.id]: devolution.endToEndId,
              },
              {
                [ReceiptPortugueseTranslation.devolutionValue]:
                  formatToFloatValueReal(devolution.amount),
              },
              {
                [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
                  devolution.createdAt,
                  'DD/MM/YYYY - HH:mm:ss',
                ),
              },
              {
                [ReceiptPortugueseTranslation.devolutionReason]:
                  devolution.description,
              },
            ],
          },
          {
            [ReceiptPortugueseTranslation.originalDepositInfo]: [
              {
                [ReceiptPortugueseTranslation.originalValue]:
                  formatToFloatValueReal(devolution.deposit.amount),
              },
              {
                [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
                  devolution.deposit.createdAt,
                  'DD/MM/YYYY - HH:mm:ss',
                ),
              },
              {
                [ReceiptPortugueseTranslation.name]:
                  devolution.deposit.thirdPartName,
              },
              {
                [PersonDocumentType.CPF]: formatCpf(
                  devolution.deposit.thirdPartDocument,
                ),
              },
              {
                [ReceiptPortugueseTranslation.id]:
                  devolution.deposit.endToEndId,
              },
              {
                [ReceiptPortugueseTranslation.institution]:
                  devolution.deposit.thirdPartBank.name,
              },
            ],
          },
        ]);

        expect(mockGetPaymentByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDepositByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDevolutionByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDevolutionReceivedByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDecodedQrCodeById).toHaveBeenCalledTimes(0);
        expect(mockGetDecodedPixAccountById).toHaveBeenCalledTimes(0);
        expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(0);
      });

      it('TC0015 - Should get a pix devolution received receipt', async () => {
        const payment = await PaymentFactory.create<PaymentEntity>(
          PaymentEntity.name,
        );
        const devolutionReceived =
          await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
            PixDevolutionReceivedEntity.name,
            { payment, state: PixDevolutionReceivedState.READY },
          );

        mockGetPaymentByOperation.mockResolvedValue(null);
        mockGetDepositByOperation.mockResolvedValue(null);
        mockGetDevolutionByOperation.mockResolvedValue(null);
        mockGetDevolutionReceivedByOperation.mockResolvedValue(
          devolutionReceived,
        );
        mockGetPaymentById.mockResolvedValue(payment);

        const message: GetReceiptByOperationIdRequest = {
          operationId: uuidV4(),
          userId: devolutionReceived.user.uuid,
          walletId: devolutionReceived.wallet.uuid,
        };

        const result = await controller.execute(
          paymentRepositoryMock,
          depositRepositoryMock,
          devolutionRepositoryMock,
          devolutionReceivedRepositoryMock,
          decodedQrCodeRepositoryMock,
          decodedPixAccountRepositoryMock,
          warningPixDevolutionRepositoryMock,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.isScheduled).toBe(false);
        expect(result.value.activeDevolution).toBe(false);
        expect(result.value.operationId).toBe(devolutionReceived.operation.id);
        expect(result.value.paymentTitle).toBe(
          ReceiptPortugueseTranslation.pixDevolution,
        );
        expect(result.value.paymentData).toMatchObject([
          {
            [ReceiptPortugueseTranslation.sourceInfo]: [
              {
                [ReceiptPortugueseTranslation.institution]:
                  payment.beneficiaryBankName,
              },
              {
                [PersonDocumentType.CPF]: formatCpf(
                  payment.beneficiaryDocument,
                ),
              },
              {
                [ReceiptPortugueseTranslation.originalValue]:
                  formatToFloatValueReal(payment.value),
              },
              {
                [ReceiptPortugueseTranslation.name]: payment.beneficiaryName,
              },
              {
                [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
                  payment.createdAt,
                  'DD/MM/YYYY - HH:mm:ss',
                ),
              },
              {
                [ReceiptPortugueseTranslation.description]:
                  ReceiptPortugueseTranslation.noDescription,
              },
            ],
          },
          {
            [ReceiptPortugueseTranslation.depositInfo]: [
              {
                [ReceiptPortugueseTranslation.id]:
                  devolutionReceived.endToEndId,
              },
              {
                [ReceiptPortugueseTranslation.valueReceived]:
                  formatToFloatValueReal(devolutionReceived.amount),
              },
              {
                [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
                  devolutionReceived.createdAt,
                  'DD/MM/YYYY - HH:mm:ss',
                ),
              },
              {
                [ReceiptPortugueseTranslation.description]:
                  devolutionReceived.description,
              },
            ],
          },
        ]);

        expect(mockGetPaymentByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDepositByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDevolutionByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDevolutionReceivedByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetPaymentById).toHaveBeenCalledTimes(1);
        expect(mockGetDecodedQrCodeById).toHaveBeenCalledTimes(0);
        expect(mockGetDecodedPixAccountById).toHaveBeenCalledTimes(0);
        expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(0);
      });

      it('TC0016 - Should get a warning pix deposit', async () => {
        const deposit = await PixDepositFactory.create<PixDepositEntity>(
          PixDepositEntity.name,
          {
            check: {
              HandleWarningPixDepositIsCefEventUseCase: false,
              HandleWarningPixDepositIsDuplicatedEventUseCase: true,
              HandleWarningPixDepositIsSuspectCpfEventUseCase: true,
              HandleWarningPixDepositIsSantanderCnpjEventUseCase: true,
              HandleWarningPixDepositIsReceitaFederalEventUseCase: true,
              HandleWarningPixDepositIsOverWarningIncomeEventUseCase: true,
            },
            state: PixDepositState.WAITING,
          },
        );

        mockGetPaymentByOperation.mockResolvedValue(null);
        mockGetDepositByOperation.mockResolvedValue(deposit);

        const message: GetReceiptByOperationIdRequest = {
          operationId: uuidV4(),
          userId: deposit.user.uuid,
          walletId: deposit.wallet.uuid,
        };

        const result = await controller.execute(
          paymentRepositoryMock,
          depositRepositoryMock,
          devolutionRepositoryMock,
          devolutionReceivedRepositoryMock,
          decodedQrCodeRepositoryMock,
          decodedPixAccountRepositoryMock,
          warningPixDevolutionRepositoryMock,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.isScheduled).toBe(false);
        expect(result.value.activeDevolution).toBe(true);
        expect(result.value.operationId).toBe(deposit.operation.id);
        expect(result.value.paymentTitle).toBe(
          ReceiptPortugueseTranslation.warningPixDevolution,
        );
        expect(result.value.paymentData).toMatchObject([
          {
            [ReceiptPortugueseTranslation.depositInfo]: [
              {
                [ReceiptPortugueseTranslation.id]: deposit.endToEndId,
              },
              {
                [ReceiptPortugueseTranslation.valueReceived]:
                  formatToFloatValueReal(deposit.amount),
              },
              {
                [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
                  deposit.createdAt,
                  'DD/MM/YYYY - HH:mm:ss',
                ),
              },
              {
                [ReceiptPortugueseTranslation.description]: deposit.description,
              },
            ],
          },
          {
            [ReceiptPortugueseTranslation.payerInfo]: [
              {
                [ReceiptPortugueseTranslation.institution]:
                  deposit.thirdPartBank.name,
              },
              {
                [PersonDocumentType.CPF]: formatCpf(deposit.thirdPartDocument),
              },
              { [ReceiptPortugueseTranslation.name]: deposit.thirdPartName },
            ],
          },
        ]);

        expect(mockGetPaymentByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDepositByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDevolutionByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionReceivedByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDecodedQrCodeById).toHaveBeenCalledTimes(0);
        expect(mockGetDecodedPixAccountById).toHaveBeenCalledTimes(0);
        expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(0);
      });

      it('TC0017 - Should get a warning pix devolution receipt', async () => {
        const deposit = await PixDepositFactory.create<PixDepositEntity>(
          PixDepositEntity.name,
          {
            state: PixDepositState.BLOCKED,
          },
        );

        const warningPixDevolution =
          await WarningPixDevolutionFactory.create<WarningPixDevolutionEntity>(
            WarningPixDevolutionEntity.name,
            {
              endToEndId: 'endToEndId',
              user: deposit.user,
            },
          );

        mockGetPaymentByOperation.mockResolvedValue(null);
        mockGetDepositByOperation.mockResolvedValue(deposit);
        mockGetWarningPixDevolutionByOperation.mockResolvedValue(
          warningPixDevolution,
        );

        const message: GetReceiptByOperationIdRequest = {
          operationId: uuidV4(),
          userId: deposit.user.uuid,
          walletId: deposit.wallet.uuid,
        };

        const result = await controller.execute(
          paymentRepositoryMock,
          depositRepositoryMock,
          devolutionRepositoryMock,
          devolutionReceivedRepositoryMock,
          decodedQrCodeRepositoryMock,
          decodedPixAccountRepositoryMock,
          warningPixDevolutionRepositoryMock,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.isScheduled).toBe(false);
        expect(result.value.activeDevolution).toBe(false);
        expect(result.value.operationId).toBe(
          warningPixDevolution.operation.id,
        );
        expect(result.value.paymentTitle).toBe(
          ReceiptPortugueseTranslation.warningPixReturned,
        );
        expect(result.value.paymentData).toMatchObject([
          {
            [ReceiptPortugueseTranslation.devolutionInfo]: [
              {
                [ReceiptPortugueseTranslation.id]:
                  warningPixDevolution.endToEndId,
              },
              {
                [ReceiptPortugueseTranslation.devolutionValue]:
                  formatToFloatValueReal(warningPixDevolution.amount),
              },
              {
                [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
                  warningPixDevolution.createdAt,
                  'DD/MM/YYYY - HH:mm:ss',
                ),
              },
              {
                [ReceiptPortugueseTranslation.devolutionReason]:
                  warningPixDevolution.description ||
                  ReceiptPortugueseTranslation.noDescription,
              },
            ],
          },
          {
            [ReceiptPortugueseTranslation.originalDepositInfo]: [
              {
                [ReceiptPortugueseTranslation.originalValue]:
                  formatToFloatValueReal(deposit.amount),
              },
              {
                [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
                  deposit.createdAt,
                  'DD/MM/YYYY - HH:mm:ss',
                ),
              },
              {
                [ReceiptPortugueseTranslation.name]: deposit.thirdPartName,
              },
              {
                [PersonDocumentType.CPF]: formatCpf(deposit.thirdPartDocument),
              },
              { [ReceiptPortugueseTranslation.id]: deposit.endToEndId },
              {
                [ReceiptPortugueseTranslation.institution]:
                  deposit.thirdPartBank.name,
              },
            ],
          },
        ]);

        expect(mockGetPaymentByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDepositByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDevolutionByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionReceivedByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDecodedQrCodeById).toHaveBeenCalledTimes(0);
        expect(mockGetDecodedPixAccountById).toHaveBeenCalledTimes(0);
        expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(1);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0018 - Should not get receipt if id is not found', async () => {
        mockGetPaymentByOperation.mockResolvedValue(null);
        mockGetDepositByOperation.mockResolvedValue(null);
        mockGetDevolutionByOperation.mockResolvedValue(null);

        const message: GetReceiptByOperationIdRequest = {
          operationId: uuidV4(),
          userId: uuidV4(),
          walletId: uuidV4(),
        };

        const result = await controller.execute(
          paymentRepositoryMock,
          depositRepositoryMock,
          devolutionRepositoryMock,
          devolutionReceivedRepositoryMock,
          decodedQrCodeRepositoryMock,
          decodedPixAccountRepositoryMock,
          warningPixDevolutionRepositoryMock,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeNull();
        expect(mockGetPaymentByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDepositByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDevolutionByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDevolutionReceivedByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDecodedQrCodeById).toHaveBeenCalledTimes(0);
        expect(mockGetDecodedPixAccountById).toHaveBeenCalledTimes(0);
        expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(0);
      });

      it('TC0019 - Should not get receipt if devolution without deposit', async () => {
        const devolution =
          await PixDevolutionFactory.create<PixDevolutionEntity>(
            PixDevolutionEntity.name,
            { createdAt: new Date() },
          );

        mockGetPaymentByOperation.mockResolvedValue(null);
        mockGetDepositByOperation.mockResolvedValue(null);
        mockGetDevolutionByOperation.mockResolvedValue(devolution);
        mockGetDepositById.mockResolvedValue(null);

        const message: GetReceiptByOperationIdRequest = {
          operationId: uuidV4(),
          userId: devolution.user.uuid,
          walletId: devolution.wallet.uuid,
        };

        const testScript = () =>
          controller.execute(
            paymentRepositoryMock,
            depositRepositoryMock,
            devolutionRepositoryMock,
            devolutionReceivedRepositoryMock,
            decodedQrCodeRepositoryMock,
            decodedPixAccountRepositoryMock,
            warningPixDevolutionRepositoryMock,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(PixDepositNotFoundException);

        expect(mockGetPaymentByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDepositByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDevolutionByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDevolutionReceivedByOperation).toHaveBeenCalledTimes(0);
        expect(mockGetDepositById).toHaveBeenCalledTimes(1);
        expect(mockGetDecodedQrCodeById).toHaveBeenCalledTimes(0);
        expect(mockGetDecodedPixAccountById).toHaveBeenCalledTimes(0);
        expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(0);
      });

      it('TC0020 - Should not get receipt if devolution received without payment', async () => {
        const devolutionReceived =
          await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
            PixDevolutionReceivedEntity.name,
          );

        mockGetPaymentByOperation.mockResolvedValue(null);
        mockGetDepositByOperation.mockResolvedValue(null);
        mockGetDevolutionByOperation.mockResolvedValue(null);
        mockGetDevolutionReceivedByOperation.mockResolvedValue(
          devolutionReceived,
        );
        mockGetPaymentById.mockResolvedValue(null);

        const message: GetReceiptByOperationIdRequest = {
          operationId: uuidV4(),
          userId: devolutionReceived.user.uuid,
          walletId: devolutionReceived.wallet.uuid,
        };

        const testScript = () =>
          controller.execute(
            paymentRepositoryMock,
            depositRepositoryMock,
            devolutionRepositoryMock,
            devolutionReceivedRepositoryMock,
            decodedQrCodeRepositoryMock,
            decodedPixAccountRepositoryMock,
            warningPixDevolutionRepositoryMock,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(PaymentNotFoundException);

        expect(mockGetPaymentByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDepositByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDevolutionByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetDevolutionReceivedByOperation).toHaveBeenCalledTimes(1);
        expect(mockGetPaymentById).toHaveBeenCalledTimes(1);
        expect(mockGetDepositById).toHaveBeenCalledTimes(0);
        expect(mockGetDecodedQrCodeById).toHaveBeenCalledTimes(0);
        expect(mockGetDecodedPixAccountById).toHaveBeenCalledTimes(0);
        expect(mockGetWarningPixDevolutionByOperation).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
