import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger as logger } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { JdpiErrorCode } from '@zro/jdpi/domain';
import {
  AccountType,
  PaymentEntity,
  QrCodeStaticEntity,
} from '@zro/pix-payments/domain';
import {
  NotifyCreditValidationCacheRepository,
  NotifyCreditValidationEntity,
  QrCodeStaticCacheRepository,
  ResultType,
} from '@zro/api-jdpi/domain';
import {
  NotifyCreditValidationEventEmitter,
  CreateNotifyCreditValidationUseCase as UseCase,
} from '@zro/api-jdpi/application';
import {
  PixPaymentServiceKafka,
  UserServiceKafka,
} from '@zro/api-jdpi/infrastructure';
import { UserFactory } from '@zro/test/users/config';
import { NotifyCreditValidationFactory } from '@zro/test/api-jdpi/config';
import {
  PaymentFactory,
  QrCodeStaticFactory,
} from '@zro/test/pix-payments/config';

describe('NotifyCreditValidationUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = (ispb: string) => {
    const {
      userService,
      mockGetUserByUuidService,
      mockGetOnboardingService,
      paymentService,
      mockGetPaymentByEndToEndIdService,
    } = mockService();

    const {
      mockNotifyCreditValidationCacheRepository,
      mockGetCreditValidationCache,
      mockQrCodeStaticCacheRepository,
      mockGetQrCodeStaticCache,
      mockCreateQrCodeStaticCache,
    } = mockRepository();

    const mockEventEmitter: NotifyCreditValidationEventEmitter =
      createMock<NotifyCreditValidationEventEmitter>();
    const mockEmitCreditValidation: jest.Mock = On(mockEventEmitter).get(
      method((mock) => mock.emitReadyCreditValidation),
    );
    const mockEmitPendingCreditValidation: jest.Mock = On(mockEventEmitter).get(
      method((mock) => mock.emitPendingCreditValidation),
    );
    const mockEmitErrorCreditValidation: jest.Mock = On(mockEventEmitter).get(
      method((mock) => mock.emitErrorCreditValidation),
    );

    const sut = new UseCase(
      logger,
      mockNotifyCreditValidationCacheRepository,
      mockQrCodeStaticCacheRepository,
      mockEventEmitter,
      userService,
      paymentService,
      ispb,
    );

    return {
      sut,
      mockGetOnboardingService,
      mockGetPaymentByEndToEndIdService,
      mockGetUserByUuidService,
      mockEmitCreditValidation,
      mockEmitErrorCreditValidation,
      mockEmitPendingCreditValidation,
      mockGetCreditValidationCache,
      mockGetQrCodeStaticCache,
      mockCreateQrCodeStaticCache,
    };
  };

  const mockRepository = () => {
    const mockNotifyCreditValidationCacheRepository: NotifyCreditValidationCacheRepository =
      createMock<NotifyCreditValidationCacheRepository>();
    const mockGetCreditValidationCache: jest.Mock = On(
      mockNotifyCreditValidationCacheRepository,
    ).get(method((mock) => mock.getByHash));

    const mockQrCodeStaticCacheRepository: QrCodeStaticCacheRepository =
      createMock<QrCodeStaticCacheRepository>();
    const mockGetQrCodeStaticCache: jest.Mock = On(
      mockQrCodeStaticCacheRepository,
    ).get(method((mock) => mock.getByTxId));
    const mockCreateQrCodeStaticCache: jest.Mock = On(
      mockQrCodeStaticCacheRepository,
    ).get(method((mock) => mock.create));

    return {
      mockNotifyCreditValidationCacheRepository,
      mockGetCreditValidationCache,
      mockQrCodeStaticCacheRepository,
      mockGetQrCodeStaticCache,
      mockCreateQrCodeStaticCache,
    };
  };

  const mockService = () => {
    const userService: UserServiceKafka = createMock<UserServiceKafka>();
    const mockGetUserByUuidService: jest.Mock = On(userService).get(
      method((mock) => mock.getUserByUuid),
    );
    const mockGetOnboardingService: jest.Mock = On(userService).get(
      method((mock) => mock.getOnboardingByAccountNumberAndStatusIsFinished),
    );

    const paymentService: PixPaymentServiceKafka =
      createMock<PixPaymentServiceKafka>();
    const mockGetPaymentByEndToEndIdService: jest.Mock = On(paymentService).get(
      method((mock) => mock.getPaymentByEndToEndId),
    );

    return {
      userService,
      mockGetUserByUuidService,
      mockGetOnboardingService,
      paymentService,
      mockGetPaymentByEndToEndIdService,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should return a valid response when all required parameters are provided', async () => {
      const data =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
          { clientConciliationId: null },
        );

      const {
        sut,
        mockGetCreditValidationCache,
        mockGetOnboardingService,
        mockGetPaymentByEndToEndIdService,
        mockGetUserByUuidService,
        mockEmitCreditValidation,
        mockEmitErrorCreditValidation,
        mockEmitPendingCreditValidation,
        mockGetQrCodeStaticCache,
        mockCreateQrCodeStaticCache,
      } = makeSut(data.clientIspb);

      const user = UserFactory.create<UserEntity>(UserEntity.name, {
        document: data.clientDocument,
        active: true,
      });

      mockGetCreditValidationCache.mockResolvedValue(null);
      mockGetOnboardingService.mockResolvedValue({});
      mockGetUserByUuidService.mockResolvedValue(user);

      const result = await sut.execute(data);

      expect(result).toBeDefined();
      expect(result.response.resultType).toBe(ResultType.VALID);
      expect(mockGetQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockGetCreditValidationCache).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByEndToEndIdService).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockEmitCreditValidation).toHaveBeenCalledTimes(1);
      expect(mockEmitErrorCreditValidation).toHaveBeenCalledTimes(0);
      expect(mockEmitPendingCreditValidation).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should return a valid response when it is a devolution', async () => {
      const data =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
          { originalEndToEndId: uuidV4(), clientConciliationId: null },
        );

      const {
        sut,
        mockGetCreditValidationCache,
        mockGetOnboardingService,
        mockGetPaymentByEndToEndIdService,
        mockGetUserByUuidService,
        mockEmitCreditValidation,
        mockEmitErrorCreditValidation,
        mockEmitPendingCreditValidation,
        mockGetQrCodeStaticCache,
        mockCreateQrCodeStaticCache,
      } = makeSut(data.clientIspb);

      const user = UserFactory.create<UserEntity>(UserEntity.name, {
        document: data.clientDocument,
        active: true,
      });
      const payment = PaymentFactory.create<PaymentEntity>(PaymentEntity.name, {
        value: data.amount,
        endToEndId: data.originalEndToEndId,
      });

      mockGetCreditValidationCache.mockResolvedValue(null);
      mockGetOnboardingService.mockResolvedValue({});
      mockGetUserByUuidService.mockResolvedValue(user);
      mockGetPaymentByEndToEndIdService.mockResolvedValue(payment);

      const result = await sut.execute(data);

      expect(result).toBeDefined();
      expect(result.response.resultType).toBe(ResultType.VALID);
      expect(mockGetQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockGetCreditValidationCache).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByEndToEndIdService).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockEmitCreditValidation).toHaveBeenCalledTimes(1);
      expect(mockEmitErrorCreditValidation).toHaveBeenCalledTimes(0);
      expect(mockEmitPendingCreditValidation).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should return a valid response when it is a devolution with groupId', async () => {
      const data =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
          {
            originalEndToEndId: uuidV4(),
            groupId: uuidV4(),
            clientConciliationId: null,
          },
        );
      const {
        sut,
        mockGetCreditValidationCache,
        mockGetOnboardingService,
        mockGetPaymentByEndToEndIdService,
        mockGetUserByUuidService,
        mockEmitCreditValidation,
        mockEmitErrorCreditValidation,
        mockEmitPendingCreditValidation,
        mockGetQrCodeStaticCache,
        mockCreateQrCodeStaticCache,
      } = makeSut(data.clientIspb);

      const user = UserFactory.create<UserEntity>(UserEntity.name, {
        document: data.clientDocument,
        active: true,
      });
      const payment = PaymentFactory.create<PaymentEntity>(PaymentEntity.name, {
        value: data.amount,
        endToEndId: data.originalEndToEndId,
      });

      mockGetCreditValidationCache.mockResolvedValue(null);
      mockGetOnboardingService.mockResolvedValue({});
      mockGetUserByUuidService.mockResolvedValue(user);
      mockGetPaymentByEndToEndIdService.mockResolvedValue(payment);

      const result = await sut.execute(data);

      expect(result).toBeDefined();
      expect(result.response.resultType).toBe(ResultType.VALID);
      expect(mockGetQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockGetCreditValidationCache).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByEndToEndIdService).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockEmitCreditValidation).toHaveBeenCalledTimes(0);
      expect(mockEmitErrorCreditValidation).toHaveBeenCalledTimes(0);
      expect(mockEmitPendingCreditValidation).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - Should return a valid response with qrcode static has no fast format', async () => {
      const data =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
          { clientConciliationId: uuidV4() },
        );

      const {
        sut,
        mockGetCreditValidationCache,
        mockGetOnboardingService,
        mockGetPaymentByEndToEndIdService,
        mockGetUserByUuidService,
        mockEmitCreditValidation,
        mockEmitErrorCreditValidation,
        mockEmitPendingCreditValidation,
        mockGetQrCodeStaticCache,
        mockCreateQrCodeStaticCache,
      } = makeSut(data.clientIspb);

      const user = UserFactory.create<UserEntity>(UserEntity.name, {
        document: data.clientDocument,
        active: true,
      });

      mockGetCreditValidationCache.mockResolvedValue(null);
      mockGetOnboardingService.mockResolvedValue({});
      mockGetUserByUuidService.mockResolvedValue(user);

      const result = await sut.execute(data);

      expect(result).toBeDefined();
      expect(result.response.resultType).toBe(ResultType.VALID);
      expect(mockGetQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockGetCreditValidationCache).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByEndToEndIdService).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockEmitCreditValidation).toHaveBeenCalledTimes(1);
      expect(mockEmitErrorCreditValidation).toHaveBeenCalledTimes(0);
      expect(mockEmitPendingCreditValidation).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should return a valid response with qrcode static has fast format but no due date', async () => {
      const qrcodeStatic = await QrCodeStaticFactory.create<QrCodeStaticEntity>(
        QrCodeStaticEntity.name,
        { txId: null, expirationDate: null, payableManyTimes: true },
      );
      const data =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
          { clientConciliationId: qrcodeStatic.txId },
        );

      const {
        sut,
        mockGetCreditValidationCache,
        mockGetOnboardingService,
        mockGetPaymentByEndToEndIdService,
        mockGetUserByUuidService,
        mockEmitCreditValidation,
        mockEmitErrorCreditValidation,
        mockEmitPendingCreditValidation,
        mockGetQrCodeStaticCache,
        mockCreateQrCodeStaticCache,
      } = makeSut(data.clientIspb);

      const user = UserFactory.create<UserEntity>(UserEntity.name, {
        document: data.clientDocument,
        active: true,
      });

      mockGetCreditValidationCache.mockResolvedValue(null);
      mockGetOnboardingService.mockResolvedValue({});
      mockGetUserByUuidService.mockResolvedValue(user);

      const result = await sut.execute(data);

      expect(result).toBeDefined();
      expect(result.response.resultType).toBe(ResultType.VALID);
      expect(mockGetQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockGetCreditValidationCache).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByEndToEndIdService).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockEmitCreditValidation).toHaveBeenCalledTimes(1);
      expect(mockEmitErrorCreditValidation).toHaveBeenCalledTimes(0);
      expect(mockEmitPendingCreditValidation).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should return a valid response when payableManyTimes is false', async () => {
      const qrcodeStatic = await QrCodeStaticFactory.create<QrCodeStaticEntity>(
        QrCodeStaticEntity.name,
        { txId: null, payableManyTimes: false },
      );
      const data =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
          { clientConciliationId: qrcodeStatic.txId },
        );

      const {
        sut,
        mockGetCreditValidationCache,
        mockGetOnboardingService,
        mockGetPaymentByEndToEndIdService,
        mockGetUserByUuidService,
        mockEmitCreditValidation,
        mockEmitErrorCreditValidation,
        mockEmitPendingCreditValidation,
        mockGetQrCodeStaticCache,
        mockCreateQrCodeStaticCache,
      } = makeSut(data.clientIspb);

      mockGetQrCodeStaticCache.mockResolvedValue(null);

      const result = await sut.execute(data);

      expect(result).toBeDefined();
      expect(result.response.resultType).toBe(ResultType.VALID);
      expect(mockGetQrCodeStaticCache).toHaveBeenCalledTimes(1);
      expect(mockCreateQrCodeStaticCache).toHaveBeenCalledTimes(1);
      expect(mockGetCreditValidationCache).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentByEndToEndIdService).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockEmitCreditValidation).toHaveBeenCalledTimes(1);
      expect(mockEmitErrorCreditValidation).toHaveBeenCalledTimes(0);
      expect(mockEmitPendingCreditValidation).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should return a valid response when payableManyTimes is true', async () => {
      const qrcodeStatic = await QrCodeStaticFactory.create<QrCodeStaticEntity>(
        QrCodeStaticEntity.name,
        { txId: null, payableManyTimes: true },
      );
      const data =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
          { clientConciliationId: qrcodeStatic.txId },
        );

      const {
        sut,
        mockGetCreditValidationCache,
        mockGetOnboardingService,
        mockGetPaymentByEndToEndIdService,
        mockGetUserByUuidService,
        mockEmitCreditValidation,
        mockEmitErrorCreditValidation,
        mockEmitPendingCreditValidation,
        mockGetQrCodeStaticCache,
        mockCreateQrCodeStaticCache,
      } = makeSut(data.clientIspb);

      const result = await sut.execute(data);

      expect(result).toBeDefined();
      expect(result.response.resultType).toBe(ResultType.VALID);
      expect(mockGetQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockGetCreditValidationCache).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentByEndToEndIdService).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockEmitCreditValidation).toHaveBeenCalledTimes(1);
      expect(mockEmitErrorCreditValidation).toHaveBeenCalledTimes(0);
      expect(mockEmitPendingCreditValidation).toHaveBeenCalledTimes(0);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0008 - Should return an invalid response when clientIspb does not match ispb', async () => {
      const data =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
        );

      const ispb = 'notmatched';

      const {
        sut,
        mockGetCreditValidationCache,
        mockGetOnboardingService,
        mockGetPaymentByEndToEndIdService,
        mockGetUserByUuidService,
        mockEmitCreditValidation,
        mockEmitErrorCreditValidation,
        mockEmitPendingCreditValidation,
        mockGetQrCodeStaticCache,
        mockCreateQrCodeStaticCache,
      } = makeSut(ispb);

      const result = await sut.execute(data);

      expect(result).toBeDefined();
      expect(result.response.resultType).toBe(ResultType.INVALID);
      expect(result.response.devolutionCode).toBe(JdpiErrorCode.DS04);
      expect(mockGetQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockGetCreditValidationCache).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentByEndToEndIdService).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockEmitCreditValidation).toHaveBeenCalledTimes(0);
      expect(mockEmitErrorCreditValidation).toHaveBeenCalledTimes(1);
      expect(mockEmitPendingCreditValidation).toHaveBeenCalledTimes(0);
    });

    it('TC0009 - Should return an invalid response when clientAccountType does not match AccountType.CACC', async () => {
      const data =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
          { clientAccountType: AccountType.CASH },
        );

      const {
        sut,
        mockGetCreditValidationCache,
        mockGetOnboardingService,
        mockGetPaymentByEndToEndIdService,
        mockGetUserByUuidService,
        mockEmitCreditValidation,
        mockEmitErrorCreditValidation,
        mockEmitPendingCreditValidation,
        mockGetQrCodeStaticCache,
        mockCreateQrCodeStaticCache,
      } = makeSut(data.clientIspb);

      const result = await sut.execute(data);

      expect(result).toBeDefined();
      expect(result.response.resultType).toBe(ResultType.INVALID);
      expect(result.response.devolutionCode).toBe(JdpiErrorCode.AG03);
      expect(mockGetQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockGetCreditValidationCache).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentByEndToEndIdService).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockEmitCreditValidation).toHaveBeenCalledTimes(0);
      expect(mockEmitErrorCreditValidation).toHaveBeenCalledTimes(1);
      expect(mockEmitPendingCreditValidation).toHaveBeenCalledTimes(0);
    });

    it('TC0010 - Should return an invalid response when clientAccountNumber is null', async () => {
      const data =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
          { clientAccountNumber: null },
        );

      const {
        sut,
        mockGetCreditValidationCache,
        mockGetOnboardingService,
        mockGetPaymentByEndToEndIdService,
        mockGetUserByUuidService,
        mockEmitCreditValidation,
        mockEmitErrorCreditValidation,
        mockEmitPendingCreditValidation,
        mockGetQrCodeStaticCache,
        mockCreateQrCodeStaticCache,
      } = makeSut(data.clientIspb);

      const result = await sut.execute(data);

      expect(result).toBeDefined();
      expect(result.response.resultType).toBe(ResultType.INVALID);
      expect(result.response.devolutionCode).toBe(JdpiErrorCode.DS04);
      expect(mockGetQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockGetCreditValidationCache).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentByEndToEndIdService).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockEmitCreditValidation).toHaveBeenCalledTimes(0);
      expect(mockEmitErrorCreditValidation).toHaveBeenCalledTimes(1);
      expect(mockEmitPendingCreditValidation).toHaveBeenCalledTimes(0);
    });

    it('TC0011 - Should return an invalid response when clientDocument is null', async () => {
      const data =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
          { clientDocument: null },
        );

      const {
        sut,
        mockGetCreditValidationCache,
        mockGetOnboardingService,
        mockGetPaymentByEndToEndIdService,
        mockGetUserByUuidService,
        mockEmitCreditValidation,
        mockEmitErrorCreditValidation,
        mockEmitPendingCreditValidation,
        mockGetQrCodeStaticCache,
        mockCreateQrCodeStaticCache,
      } = makeSut(data.clientIspb);

      const result = await sut.execute(data);

      expect(result).toBeDefined();
      expect(result.response.resultType).toBe(ResultType.INVALID);
      expect(result.response.devolutionCode).toBe(JdpiErrorCode.DS04);
      expect(mockGetQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockGetCreditValidationCache).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentByEndToEndIdService).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockEmitCreditValidation).toHaveBeenCalledTimes(0);
      expect(mockEmitErrorCreditValidation).toHaveBeenCalledTimes(1);
      expect(mockEmitPendingCreditValidation).toHaveBeenCalledTimes(0);
    });

    it('TC0012 - Should return an invalid response when qrcode static has invalid checksum', async () => {
      const qrcodeStatic = await QrCodeStaticFactory.create<QrCodeStaticEntity>(
        QrCodeStaticEntity.name,
        { txId: null, expirationDate: faker.date.past() },
      );
      const data =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
          { clientConciliationId: qrcodeStatic.txId[0] + uuidV4() },
        );

      const {
        sut,
        mockGetCreditValidationCache,
        mockGetOnboardingService,
        mockGetPaymentByEndToEndIdService,
        mockGetUserByUuidService,
        mockEmitCreditValidation,
        mockEmitErrorCreditValidation,
        mockEmitPendingCreditValidation,
        mockGetQrCodeStaticCache,
        mockCreateQrCodeStaticCache,
      } = makeSut(data.clientIspb);

      const result = await sut.execute(data);

      expect(result).toBeDefined();
      expect(result.response.resultType).toBe(ResultType.INVALID);
      expect(result.response.devolutionCode).toBe(JdpiErrorCode.BE17);
      expect(mockGetQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockGetCreditValidationCache).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentByEndToEndIdService).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockEmitCreditValidation).toHaveBeenCalledTimes(0);
      expect(mockEmitErrorCreditValidation).toHaveBeenCalledTimes(1);
      expect(mockEmitPendingCreditValidation).toHaveBeenCalledTimes(0);
    });

    it('TC0013 - Should return an invalid response when qrcode static is expired', async () => {
      const qrcodeStatic = await QrCodeStaticFactory.create<QrCodeStaticEntity>(
        QrCodeStaticEntity.name,
        { txId: null, expirationDate: faker.date.past() },
      );
      const data =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
          { clientConciliationId: qrcodeStatic.txId },
        );

      const {
        sut,
        mockGetCreditValidationCache,
        mockGetOnboardingService,
        mockGetPaymentByEndToEndIdService,
        mockGetUserByUuidService,
        mockEmitCreditValidation,
        mockEmitErrorCreditValidation,
        mockEmitPendingCreditValidation,
        mockGetQrCodeStaticCache,
        mockCreateQrCodeStaticCache,
      } = makeSut(data.clientIspb);

      const result = await sut.execute(data);

      expect(result).toBeDefined();
      expect(result.response.resultType).toBe(ResultType.INVALID);
      expect(result.response.devolutionCode).toBe(JdpiErrorCode.BE17);
      expect(mockGetQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockGetCreditValidationCache).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentByEndToEndIdService).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockEmitCreditValidation).toHaveBeenCalledTimes(0);
      expect(mockEmitErrorCreditValidation).toHaveBeenCalledTimes(1);
      expect(mockEmitPendingCreditValidation).toHaveBeenCalledTimes(0);
    });

    it('TC0014 - Should return an invalid response when qrcode static has different value', async () => {
      const qrcodeStatic = await QrCodeStaticFactory.create<QrCodeStaticEntity>(
        QrCodeStaticEntity.name,
        { txId: null, documentValue: faker.datatype.number({ min: 1 }) },
      );
      const data =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
          { clientConciliationId: qrcodeStatic.txId, amount: 0 },
        );

      const {
        sut,
        mockGetCreditValidationCache,
        mockGetOnboardingService,
        mockGetPaymentByEndToEndIdService,
        mockGetUserByUuidService,
        mockEmitCreditValidation,
        mockEmitErrorCreditValidation,
        mockEmitPendingCreditValidation,
        mockGetQrCodeStaticCache,
        mockCreateQrCodeStaticCache,
      } = makeSut(data.clientIspb);

      const result = await sut.execute(data);

      expect(result).toBeDefined();
      expect(result.response.resultType).toBe(ResultType.INVALID);
      expect(result.response.devolutionCode).toBe(JdpiErrorCode.BE17);
      expect(mockGetQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockGetCreditValidationCache).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentByEndToEndIdService).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockEmitCreditValidation).toHaveBeenCalledTimes(0);
      expect(mockEmitErrorCreditValidation).toHaveBeenCalledTimes(1);
      expect(mockEmitPendingCreditValidation).toHaveBeenCalledTimes(0);
    });

    it('TC0015 - Should return an invalid response when qrcode static is paid', async () => {
      const qrcodeStatic = await QrCodeStaticFactory.create<QrCodeStaticEntity>(
        QrCodeStaticEntity.name,
        {
          txId: null,
          payableManyTimes: false,
          documentValue: faker.datatype.number(),
        },
      );
      const data =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
          {
            clientConciliationId: qrcodeStatic.txId,
            amount: qrcodeStatic.documentValue,
          },
        );

      const {
        sut,
        mockGetCreditValidationCache,
        mockGetOnboardingService,
        mockGetPaymentByEndToEndIdService,
        mockGetUserByUuidService,
        mockEmitCreditValidation,
        mockEmitErrorCreditValidation,
        mockEmitPendingCreditValidation,
        mockGetQrCodeStaticCache,
        mockCreateQrCodeStaticCache,
      } = makeSut(data.clientIspb);

      mockGetQrCodeStaticCache.mockResolvedValue(qrcodeStatic);

      const result = await sut.execute(data);

      expect(result).toBeDefined();
      expect(result.response.resultType).toBe(ResultType.INVALID);
      expect(result.response.devolutionCode).toBe(JdpiErrorCode.BE17);
      expect(mockGetQrCodeStaticCache).toHaveBeenCalledTimes(1);
      expect(mockCreateQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockGetCreditValidationCache).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentByEndToEndIdService).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockEmitCreditValidation).toHaveBeenCalledTimes(0);
      expect(mockEmitErrorCreditValidation).toHaveBeenCalledTimes(1);
      expect(mockEmitPendingCreditValidation).toHaveBeenCalledTimes(0);
    });

    it('TC0016 - Should return an invalid response when the wallet account is not found', async () => {
      const data =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
          { clientConciliationId: null },
        );

      const {
        sut,
        mockGetCreditValidationCache,
        mockGetOnboardingService,
        mockGetPaymentByEndToEndIdService,
        mockGetUserByUuidService,
        mockEmitCreditValidation,
        mockEmitErrorCreditValidation,
        mockEmitPendingCreditValidation,
        mockGetQrCodeStaticCache,
        mockCreateQrCodeStaticCache,
      } = makeSut(data.clientIspb);

      mockGetCreditValidationCache.mockResolvedValue(null);
      mockGetOnboardingService.mockResolvedValue(null);

      const result = await sut.execute(data);

      expect(result).toBeDefined();
      expect(result.response.resultType).toBe(ResultType.INVALID);
      expect(result.response.devolutionCode).toBe(JdpiErrorCode.AC03);
      expect(mockGetQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockGetCreditValidationCache).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByEndToEndIdService).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockEmitCreditValidation).toHaveBeenCalledTimes(0);
      expect(mockEmitErrorCreditValidation).toHaveBeenCalledTimes(1);
      expect(mockEmitPendingCreditValidation).toHaveBeenCalledTimes(0);
    });

    it('TC0017 - Should return an invalid response when the validation cache is invalid', async () => {
      const data =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
          { clientConciliationId: null },
        );

      const {
        sut,
        mockGetCreditValidationCache,
        mockGetOnboardingService,
        mockGetPaymentByEndToEndIdService,
        mockGetUserByUuidService,
        mockEmitCreditValidation,
        mockEmitErrorCreditValidation,
        mockEmitPendingCreditValidation,
        mockGetQrCodeStaticCache,
        mockCreateQrCodeStaticCache,
      } = makeSut(data.clientIspb);

      data.response.resultType = ResultType.INVALID;
      mockGetCreditValidationCache.mockResolvedValue(data);

      const result = await sut.execute(data);

      expect(result).toBeDefined();
      expect(result.response.resultType).toBe(ResultType.INVALID);
      expect(result.response.devolutionCode).toBe(data.response.devolutionCode);
      expect(mockGetQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockGetCreditValidationCache).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentByEndToEndIdService).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockEmitCreditValidation).toHaveBeenCalledTimes(0);
      expect(mockEmitErrorCreditValidation).toHaveBeenCalledTimes(1);
      expect(mockEmitPendingCreditValidation).toHaveBeenCalledTimes(0);
    });

    it('TC0018 - Should return an invalid response when the user is not found', async () => {
      const data =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
          { clientConciliationId: null },
        );

      const {
        sut,
        mockGetCreditValidationCache,
        mockGetOnboardingService,
        mockGetPaymentByEndToEndIdService,
        mockGetUserByUuidService,
        mockEmitCreditValidation,
        mockEmitErrorCreditValidation,
        mockEmitPendingCreditValidation,
        mockGetQrCodeStaticCache,
        mockCreateQrCodeStaticCache,
      } = makeSut(data.clientIspb);

      mockGetCreditValidationCache.mockResolvedValue(null);
      mockGetOnboardingService.mockResolvedValue({});
      mockGetUserByUuidService.mockResolvedValue(null);

      const result = await sut.execute(data);

      expect(result).toBeDefined();
      expect(result.response.resultType).toBe(ResultType.INVALID);
      expect(result.response.devolutionCode).toBe(JdpiErrorCode.ED05);
      expect(mockGetQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockGetCreditValidationCache).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByEndToEndIdService).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockEmitCreditValidation).toHaveBeenCalledTimes(0);
      expect(mockEmitErrorCreditValidation).toHaveBeenCalledTimes(1);
      expect(mockEmitPendingCreditValidation).toHaveBeenCalledTimes(0);
    });

    it('TC0019 - Should return an invalid response when the user document is not equal to clientDocument', async () => {
      const data =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
          { clientConciliationId: null },
        );
      const user = UserFactory.create<UserEntity>(UserEntity.name);

      const {
        sut,
        mockGetCreditValidationCache,
        mockGetOnboardingService,
        mockGetPaymentByEndToEndIdService,
        mockGetUserByUuidService,
        mockEmitCreditValidation,
        mockEmitErrorCreditValidation,
        mockEmitPendingCreditValidation,
        mockGetQrCodeStaticCache,
        mockCreateQrCodeStaticCache,
      } = makeSut(data.clientIspb);

      mockGetCreditValidationCache.mockResolvedValue(null);
      mockGetOnboardingService.mockResolvedValue({});
      mockGetUserByUuidService.mockResolvedValue(user);

      const result = await sut.execute(data);

      expect(result).toBeDefined();
      expect(result.response.resultType).toBe(ResultType.INVALID);
      expect(result.response.devolutionCode).toBe(JdpiErrorCode.BE01);
      expect(mockGetQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockGetCreditValidationCache).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByEndToEndIdService).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockEmitCreditValidation).toHaveBeenCalledTimes(0);
      expect(mockEmitErrorCreditValidation).toHaveBeenCalledTimes(1);
      expect(mockEmitPendingCreditValidation).toHaveBeenCalledTimes(0);
    });

    it('TC0020 - Should return an invalid response when the user is not active', async () => {
      const data =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
          { clientConciliationId: null },
        );
      const user = UserFactory.create<UserEntity>(UserEntity.name, {
        document: data.clientDocument,
        active: false,
      });

      const {
        sut,
        mockGetCreditValidationCache,
        mockGetOnboardingService,
        mockGetPaymentByEndToEndIdService,
        mockGetUserByUuidService,
        mockEmitCreditValidation,
        mockEmitErrorCreditValidation,
        mockEmitPendingCreditValidation,
        mockGetQrCodeStaticCache,
        mockCreateQrCodeStaticCache,
      } = makeSut(data.clientIspb);

      mockGetCreditValidationCache.mockResolvedValue(null);
      mockGetOnboardingService.mockResolvedValue({});
      mockGetUserByUuidService.mockResolvedValue(user);

      const result = await sut.execute(data);

      expect(result).toBeDefined();
      expect(result.response.resultType).toBe(ResultType.INVALID);
      expect(result.response.devolutionCode).toBe(JdpiErrorCode.AC07);
      expect(mockGetQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockGetCreditValidationCache).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByEndToEndIdService).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockEmitCreditValidation).toHaveBeenCalledTimes(0);
      expect(mockEmitErrorCreditValidation).toHaveBeenCalledTimes(1);
      expect(mockEmitPendingCreditValidation).toHaveBeenCalledTimes(0);
    });

    it('TC0021 - Should return an invalid response when devolution has no original payment', async () => {
      const data =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
          { originalEndToEndId: uuidV4(), clientConciliationId: null },
        );
      const user = UserFactory.create<UserEntity>(UserEntity.name, {
        document: data.clientDocument,
        active: true,
      });

      const {
        sut,
        mockGetCreditValidationCache,
        mockGetOnboardingService,
        mockGetPaymentByEndToEndIdService,
        mockGetUserByUuidService,
        mockEmitCreditValidation,
        mockEmitErrorCreditValidation,
        mockEmitPendingCreditValidation,
        mockGetQrCodeStaticCache,
        mockCreateQrCodeStaticCache,
      } = makeSut(data.clientIspb);

      mockGetCreditValidationCache.mockResolvedValue(null);
      mockGetOnboardingService.mockResolvedValue({});
      mockGetUserByUuidService.mockResolvedValue(user);
      mockGetPaymentByEndToEndIdService.mockResolvedValue(null);

      const result = await sut.execute(data);

      expect(result).toBeDefined();
      expect(result.response.resultType).toBe(ResultType.INVALID);
      expect(result.response.devolutionCode).toBe(JdpiErrorCode.ED05);
      expect(mockGetQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockGetCreditValidationCache).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByEndToEndIdService).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockEmitCreditValidation).toHaveBeenCalledTimes(0);
      expect(mockEmitErrorCreditValidation).toHaveBeenCalledTimes(1);
      expect(mockEmitPendingCreditValidation).toHaveBeenCalledTimes(0);
    });

    it('TC0022 - Should return an invalid response when devolution has amount greater than payment', async () => {
      const data =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
          { originalEndToEndId: uuidV4(), clientConciliationId: null },
        );

      const user = UserFactory.create<UserEntity>(UserEntity.name, {
        document: data.clientDocument,
        active: true,
      });

      const payment = PaymentFactory.create<PaymentEntity>(PaymentEntity.name, {
        value: data.amount - 1,
        endToEndId: data.originalEndToEndId,
      });

      const {
        sut,
        mockGetCreditValidationCache,
        mockGetOnboardingService,
        mockGetPaymentByEndToEndIdService,
        mockGetUserByUuidService,
        mockEmitCreditValidation,
        mockEmitErrorCreditValidation,
        mockEmitPendingCreditValidation,
        mockGetQrCodeStaticCache,
        mockCreateQrCodeStaticCache,
      } = makeSut(data.clientIspb);

      mockGetCreditValidationCache.mockResolvedValue(null);
      mockGetOnboardingService.mockResolvedValue({});
      mockGetUserByUuidService.mockResolvedValue(user);
      mockGetPaymentByEndToEndIdService.mockResolvedValue(payment);

      const result = await sut.execute(data);

      expect(result).toBeDefined();
      expect(result.response.resultType).toBe(ResultType.INVALID);
      expect(result.response.devolutionCode).toBe(JdpiErrorCode.AM09);
      expect(mockGetQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockGetCreditValidationCache).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByEndToEndIdService).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockEmitCreditValidation).toHaveBeenCalledTimes(0);
      expect(mockEmitErrorCreditValidation).toHaveBeenCalledTimes(1);
      expect(mockEmitPendingCreditValidation).toHaveBeenCalledTimes(0);
    });

    it('TC0023 - Should return an invalid response when devolution has no original payment with groupId', async () => {
      const data =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
          {
            originalEndToEndId: uuidV4(),
            clientConciliationId: null,
            groupId: uuidV4(),
          },
        );
      const user = UserFactory.create<UserEntity>(UserEntity.name, {
        document: data.clientDocument,
        active: true,
      });

      const {
        sut,
        mockGetCreditValidationCache,
        mockGetOnboardingService,
        mockGetPaymentByEndToEndIdService,
        mockGetUserByUuidService,
        mockEmitCreditValidation,
        mockEmitErrorCreditValidation,
        mockEmitPendingCreditValidation,
        mockGetQrCodeStaticCache,
        mockCreateQrCodeStaticCache,
      } = makeSut(data.clientIspb);

      mockGetCreditValidationCache.mockResolvedValue(null);
      mockGetOnboardingService.mockResolvedValue({});
      mockGetUserByUuidService.mockResolvedValue(user);
      mockGetPaymentByEndToEndIdService.mockResolvedValue(null);

      const result = await sut.execute(data);

      expect(result).toBeDefined();
      expect(result.response.resultType).toBe(ResultType.INVALID);
      expect(result.response.devolutionCode).toBe(JdpiErrorCode.ED05);
      expect(mockGetQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeStaticCache).toHaveBeenCalledTimes(0);
      expect(mockGetCreditValidationCache).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentByEndToEndIdService).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockEmitCreditValidation).toHaveBeenCalledTimes(0);
      expect(mockEmitErrorCreditValidation).toHaveBeenCalledTimes(0);
      expect(mockEmitPendingCreditValidation).toHaveBeenCalledTimes(1);
    });
  });
});
