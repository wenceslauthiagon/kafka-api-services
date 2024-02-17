import { GatewayException, ExceptionTypes, IException } from '@zro/common';

export class PixKeyPspException extends GatewayException {
  constructor(error?: IException) {
    super({
      type: error?.type ?? ExceptionTypes.SYSTEM,
      code: error?.code ?? 'PSP_ERROR',
      data: error?.data ?? error,
    });
  }
}

export class OfflinePixKeyPspException extends PixKeyPspException {
  constructor(error: Error) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'PSP_OFFLINE',
      data: error,
    });
  }
}

export class PixKeyOwnedByThirdPersonPspException extends PixKeyPspException {
  constructor(error: Error) {
    super({
      type: ExceptionTypes.USER,
      code: 'KEY_OWENED_BY_THIRD_PERSON_PSP',
      data: error,
    });
  }
}

export class PixKeyOwnedBySamePersonPspException extends PixKeyPspException {
  constructor(error: Error) {
    super({
      type: ExceptionTypes.USER,
      code: 'KEY_OWENED_BY_SAME_PERSON_PSP',
      data: error,
    });
  }
}

export class PixKeyLockedByClaimPspException extends PixKeyPspException {
  constructor(error: Error) {
    super({
      type: ExceptionTypes.USER,
      code: 'KEY_LOCKED_BY_CLAIM_PSP',
      data: error,
    });
  }
}

export class PixKeyDuplicatePspException extends PixKeyPspException {
  constructor(error: Error) {
    super({
      type: ExceptionTypes.USER,
      code: 'KEY_DUPLICATED_PSP',
      data: error,
    });
  }
}

export class MaxNumberOfPixKeysReachedPixKeyPspException extends PixKeyPspException {
  constructor(error: Error) {
    super({
      type: ExceptionTypes.USER,
      code: 'KEY_MAX_NUMBER_OF_KEYS_REACHED',
      data: error,
    });
  }
}

export class PixKeyOperationTimeOverflowPspException extends PixKeyPspException {
  constructor(error: Error) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'KEY_OPERATION_TIME_OVERFLOW',
      data: error,
    });
  }
}

export class InvalidDataFormatPixKeyPspException extends PixKeyPspException {
  constructor(error: Error) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'INVALID_FORMAT_KEY_PSP',
      data: error,
    });
  }
}

export class PixKeyNotFoundExceptionPspException extends PixKeyPspException {
  constructor(error: Error) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_KEY_NOT_FOUND_PSP',
      data: error,
    });
  }
}
