import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  LoggerParam,
  RepositoryParam,
  ObserverController,
  KafkaEventPattern,
} from '@zro/common';
import {
  UserWithdrawSettingRequest,
  UserWithdrawSettingRequestRepository,
} from '@zro/compliance/domain';
import {
  KAFKA_EVENTS,
  UserWithdrawSettingRequestDatabaseRepository,
} from '@zro/compliance/infrastructure';
import {
  HandleUserWithdrawSettingRequestFailedByDocumentController,
  HandleUserWithdrawSettingRequestFailedByDocumentRequest,
} from '@zro/compliance/interface';

/**
 * FailedByDocument user withdraw setting request event.
 */
@Controller()
@ObserverController()
export class HandleUserWithdrawSettingRequestFailedByDocumentNestObserver {
  /**
   * Handle pending user withdraw setting request event.
   *
   * @param message Event Kafka message.
   * @param userWithdrawSettingRequestRepository User withdraw setting request repository.
   * @param logger Local logger instance.
   */
  @KafkaEventPattern(
    KAFKA_EVENTS.USER_WITHDRAW_SETTING_REQUEST.FAILED_BY_DOCUMENT,
  )
  async execute(
    @Payload('value') message: UserWithdrawSettingRequest,
    @RepositoryParam(UserWithdrawSettingRequestDatabaseRepository)
    userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository,
    @LoggerParam(HandleUserWithdrawSettingRequestFailedByDocumentNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleUserWithdrawSettingRequestFailedByDocumentRequest(
      {
        id: message.id,
        state: message.state,
        analysisResult: message.analysisResult,
        type: message.type,
        balance: message.balance,
        day: message.day,
        weekDay: message.weekDay,
        issueId: message.issueId,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        closedAt: message.closedAt,
        walletId: message.wallet.uuid,
        transactionTypeTag: message.transactionType.tag,
        pixKey: message.pixKey.key,
        pixKeyType: message.pixKey.type,
        pixKeyDocument: message.pixKey?.document,
        userId: message.user.uuid,
        decodedPixKeyIspb: message.decodedPixKey?.ispb,
        decodedPixKeyBranch: message.decodedPixKey?.branch,
        decodedPixKeyAccountNumber: message.decodedPixKey?.accountNumber,
        decodedPixKeyName: message.decodedPixKey?.name,
        decodedPixKeyDocument: message.decodedPixKey?.document,
        decodedPixKeyCreatedAt: message.decodedPixKey?.createdAt,
      },
    );

    logger.debug('Creating user withdraw setting request failed.', {
      payload,
    });

    const controller =
      new HandleUserWithdrawSettingRequestFailedByDocumentController(
        logger,
        userWithdrawSettingRequestRepository,
      );

    // Call handle failed by document user withdraw setting request event controller.
    await controller.execute(payload);

    logger.info(
      'FailedByDocument user withdraw setting request event handled.',
    );
  }
}
