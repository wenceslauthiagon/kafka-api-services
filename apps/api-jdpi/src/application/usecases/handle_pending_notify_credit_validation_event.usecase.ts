import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { NotifyCreditValidation, ResultType } from '@zro/api-jdpi/domain';
import {
  NotifyCreditValidationEventEmitter,
  PixStatementGateway,
  VerifyNotifyCreditPixStatementPspRequest,
} from '@zro/api-jdpi/application';

export class HandlePendingNotifyCreditValidationEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pspGateway Pix statement psp gateway.
   * @param eventEmitter Notify credit validation event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly pspGateway: PixStatementGateway,
    private readonly eventEmitter: NotifyCreditValidationEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandlePendingNotifyCreditValidationEventUseCase.name,
    });
  }

  /**
   * Handle pending notify credit validation.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(payload: NotifyCreditValidation): Promise<void> {
    if (
      !payload?.id ||
      !payload?.groupId ||
      !payload?.endToEndId ||
      !payload?.response?.resultType
    ) {
      throw new MissingDataException([
        ...(!payload?.id ? ['Notify Credit Validation ID'] : []),
        ...(!payload?.groupId ? ['Notify Credit Validation Group ID'] : []),
        ...(!payload?.endToEndId
          ? ['Notify Credit Validation End To End ID']
          : []),
        ...(!payload?.response?.resultType
          ? ['Notify Credit Validation Result Type']
          : []),
      ]);
    }

    const request: VerifyNotifyCreditPixStatementPspRequest = {
      id: payload.id,
      groupId: payload.groupId,
      endToEndId: payload.endToEndId,
      resultType: payload.response.resultType,
      ...(payload.response.devolutionCode && {
        devolutionCode: payload.response.devolutionCode,
      }),
      ...(payload.response.description && {
        description: payload.response.description,
      }),
      createdAt: payload.response.createdAt,
    };

    this.logger.debug(
      'Verify notify credit on Pix Statement PSP Gateway request.',
      { request },
    );

    try {
      const response =
        await this.pspGateway.verifyNotifyCreditPixStatement(request);

      this.logger.debug(
        'Verify notify credit on Pix Statement PSP Gateway response.',
        { response },
      );

      if (payload.response.resultType === ResultType.VALID) {
        this.eventEmitter.emitReadyCreditValidation(payload);
      } else {
        this.eventEmitter.emitErrorCreditValidation(payload);
      }
    } catch (error) {
      this.logger.error(
        'Error while verifying notify credit on Pix Statement PSP Gateway',
        error,
      );

      this.eventEmitter.emitErrorCreditValidation(payload);
    }
  }
}
