import { Logger } from 'winston';
import { createHash } from 'crypto';
import { getMoment } from '@zro/common';
import { JdpiErrorCode } from '@zro/jdpi/domain';
import { AccountType, QrCodeStaticEntity } from '@zro/pix-payments/domain';
import {
  NotifyCreditValidation,
  NotifyCreditValidationCacheRepository,
  QrCodeStaticCacheRepository,
  ResultType,
} from '@zro/api-jdpi/domain';
import {
  NotifyCreditValidationEventEmitter,
  PixPaymentService,
  UserService,
} from '@zro/api-jdpi/application';

type NotifyCreditValidationHashInformation = Pick<
  NotifyCreditValidation,
  'clientAccountNumber'
>;

export class CreateNotifyCreditValidationUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param userService User service.
   * @param pixPaymentService Pix payment service.
   * @param notifyCreditValidationEmitter notifyCreditValidation emitter.
   * @param ispb ispb.
   */
  constructor(
    private logger: Logger,
    private readonly notifyCreditValidationCacheRepository: NotifyCreditValidationCacheRepository,
    private readonly qrCodeStaticCacheRepository: QrCodeStaticCacheRepository,
    private readonly notifyCreditValidationEmitter: NotifyCreditValidationEventEmitter,
    private readonly userService: UserService,
    private readonly pixPaymentService: PixPaymentService,
    private readonly ispb: string,
  ) {
    this.logger = logger.child({
      context: CreateNotifyCreditValidationUseCase.name,
    });
  }

  /**
   * Notify Credit Validation.
   */
  async execute(
    payload: NotifyCreditValidation,
  ): Promise<NotifyCreditValidation> {
    const {
      clientAccountNumber,
      clientDocument,
      clientIspb,
      clientAccountType,
      amount,
      originalEndToEndId,
    } = payload;

    // FIXME: add JdpiErrorCode.LIMIT_EXCEEDED (AM02) verification
    // because when creates an operation, it is checked.

    if (
      !clientIspb ||
      clientIspb !== this.ispb ||
      !clientAccountNumber ||
      !clientDocument
    ) {
      this.logger.error('Client info is invalid.', {
        clientIspb,
        clientDocument,
        clientAccountNumber,
      });

      return this.handleInvalidCredit(payload, JdpiErrorCode.DS04);
    }

    if (clientAccountType !== AccountType.CACC) {
      this.logger.error('Client account type is invalid.', {
        clientAccountType,
      });

      return this.handleInvalidCredit(payload, JdpiErrorCode.AG03);
    }

    // If clientConciliationId (txId) exists, decodes txId data.
    if (payload.clientConciliationId) {
      this.logger.debug('TxId on payload.', {
        txId: payload.clientConciliationId,
      });

      const qrCodeStatic = new QrCodeStaticEntity({
        txId: payload.clientConciliationId,
      });

      // Only qrCodeStatics with fastFormat and expiration date use Cache flow.
      if (qrCodeStatic.isFastFormat()) {
        if (!qrCodeStatic.checkTxId()) {
          this.logger.error('QrcodeStatic txId is invalid.', {
            txId: qrCodeStatic.txId,
          });
          return this.handleInvalidCredit(payload, JdpiErrorCode.BE17);
        }

        // Check if QRCode has value and it is equal to payload amount.
        if (qrCodeStatic.hasValue()) {
          qrCodeStatic.documentValue = qrCodeStatic.getValue();
          if (qrCodeStatic.documentValue !== payload.amount) {
            this.logger.error(
              'QrcodeStatic and payload amount are differents.',
              {
                payloadAmount: payload.amount,
                qrCodeStaticAmount: qrCodeStatic.documentValue,
              },
            );
            return this.handleInvalidCredit(payload, JdpiErrorCode.BE17);
          }
        }

        if (qrCodeStatic.hasDueDate()) {
          return this.checkQrCodeStaticWithDueDate(qrCodeStatic, payload);
        }
      }
    }

    // Check validation in cache.
    const hashInformation: NotifyCreditValidationHashInformation = {
      clientAccountNumber,
    };
    const hash = createHash('sha1')
      .update(JSON.stringify(hashInformation))
      .digest('base64');

    const checkNotifyCreditValidationInCache =
      await this.notifyCreditValidationCacheRepository.getByHash(hash);

    if (checkNotifyCreditValidationInCache) {
      this.logger.debug('NotifyCreditValidation found in cache.', {
        checkNotifyCreditValidationInCache,
      });

      payload.response = {
        ...checkNotifyCreditValidationInCache.response,
        createdAt: new Date(),
      };

      return payload.response.resultType === ResultType.VALID
        ? this.handleValidCredit(payload)
        : this.handleInvalidCredit(payload, payload.response.devolutionCode);
    }

    const onboarding =
      await this.userService.getOnboardingByAccountNumberAndStatusIsFinished(
        clientAccountNumber,
      );

    this.logger.debug('Get onboarding by accountNumber.', { onboarding });

    if (!onboarding) {
      this.logger.error('Onboarding not found.', { clientAccountNumber });

      return this.handleInvalidCredit(payload, JdpiErrorCode.AC03, hash);
    }

    const user = await this.userService.getUserByUuid(onboarding.user);

    this.logger.debug('Get User by uuid.', { user });

    if (!user) {
      this.logger.error('User not found.', { user: onboarding.user });

      return this.handleInvalidCredit(payload, JdpiErrorCode.ED05, hash);
    }

    if (user.document !== clientDocument) {
      this.logger.error('User document not match.', { clientDocument });

      return this.handleInvalidCredit(payload, JdpiErrorCode.BE01, hash);
    }

    if (!user.active) {
      this.logger.error('User is not active.', { user });

      return this.handleInvalidCredit(payload, JdpiErrorCode.AC07, hash);
    }

    if (originalEndToEndId) {
      const originalPayment =
        await this.pixPaymentService.getPaymentByEndToEndId(originalEndToEndId);

      this.logger.debug('Payment found by devolution endToEndId.', {
        originalPayment,
      });

      if (!originalPayment) {
        this.logger.error('Payment not found.', { originalEndToEndId });

        return this.handleInvalidCredit(payload, JdpiErrorCode.ED05, hash);
      }

      if (amount > originalPayment.value) {
        this.logger.info(
          'Devolution amount is greater than the original payment amount.',
          { amount },
        );

        return this.handleInvalidCredit(payload, JdpiErrorCode.AM09, hash);
      }
    }

    return this.handleValidCredit(payload, hash);
  }

  private async handleValidCredit(
    payload: NotifyCreditValidation,
    hash?: string,
  ): Promise<NotifyCreditValidation> {
    payload.response = {
      resultType: ResultType.VALID,
      createdAt: new Date(),
    };

    this.logger.debug('Notify credit validation response.', {
      response: payload.response,
    });

    if (hash) {
      await this.notifyCreditValidationCacheRepository.createHash(
        hash,
        payload,
      );
    }

    if (payload.groupId) {
      this.notifyCreditValidationEmitter.emitPendingCreditValidation(payload);
    } else {
      this.notifyCreditValidationEmitter.emitReadyCreditValidation(payload);
    }

    return payload;
  }

  private async handleInvalidCredit(
    payload: NotifyCreditValidation,
    devolutionCode: JdpiErrorCode,
    hash?: string,
  ): Promise<NotifyCreditValidation> {
    payload.response = {
      resultType: ResultType.INVALID,
      createdAt: new Date(),
      devolutionCode,
    };

    this.logger.debug('Notify credit validation error.', {
      response: payload.response,
    });

    if (hash) {
      await this.notifyCreditValidationCacheRepository.createHash(
        hash,
        payload,
      );
    }

    if (payload.groupId) {
      this.notifyCreditValidationEmitter.emitPendingCreditValidation(payload);
    } else {
      this.notifyCreditValidationEmitter.emitErrorCreditValidation(payload);
    }

    return payload;
  }

  private async checkQrCodeStaticWithDueDate(
    txIdData: QrCodeStaticEntity,
    payload: NotifyCreditValidation,
  ) {
    // Check if QRCode is expired.
    const now = getMoment();
    txIdData.expirationDate = txIdData.getDueDate();
    if (getMoment(txIdData.expirationDate).isSameOrBefore(now)) {
      this.logger.error('QrcodeStatic is expired.', {
        now,
        expirationDate: txIdData.expirationDate,
      });
      return this.handleInvalidCredit(payload, JdpiErrorCode.BE17);
    }

    // If yes, it doesn't need to use cache.
    txIdData.payableManyTimes = txIdData.isPayableManyTimes();
    if (txIdData.isPayableManyTimes()) {
      return this.handleValidCredit(payload);
    }

    const qrcodeStaticFound = await this.qrCodeStaticCacheRepository.getByTxId(
      txIdData.txId,
    );

    this.logger.debug('Get qrcodeStatic by txId.', { qrcodeStaticFound });

    // If it exists, it means QrcodeStatic is already paid.
    if (qrcodeStaticFound) {
      this.logger.error('QrcodeStatic is already paid.', {
        txId: txIdData.txId,
      });
      return this.handleInvalidCredit(payload, JdpiErrorCode.BE17);
    }

    // Save this one to be paid just one time.
    const ttl = txIdData.expirationDate.getTime() - Date.now();
    await this.qrCodeStaticCacheRepository.create(txIdData, ttl);

    return this.handleValidCredit(payload);
  }
}
