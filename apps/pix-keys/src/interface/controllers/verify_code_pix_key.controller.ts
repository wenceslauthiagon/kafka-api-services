import { Logger } from 'winston';
import { UserEntity } from '@zro/users/domain';
import {
  PixKey,
  KeyType,
  PixKeyRepository,
  PixKeyVerificationRepository,
  KeyState,
  ClaimReasonType,
} from '@zro/pix-keys/domain';
import { VerifyCodePixKeyUseCase as UseCase } from '@zro/pix-keys/application';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export interface VerifyCodePixKeyRequest {
  userId: string;
  id: string;
  code: string;
  reason: ClaimReasonType;
}

export interface VerifyCodePixKeyResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

function verifyCodePixKeyPresenter(pixKey: PixKey): VerifyCodePixKeyResponse {
  if (!pixKey) return null;

  const response: VerifyCodePixKeyResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}

export class VerifyCodePixKeyController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
    pixKeyVerificationRepository: PixKeyVerificationRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    numberOfRetries = 3,
  ) {
    this.logger = logger.child({
      context: VerifyCodePixKeyController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(
      this.logger,
      pixKeyRepository,
      pixKeyVerificationRepository,
      eventEmitter,
      numberOfRetries,
    );
  }

  async execute(
    request: VerifyCodePixKeyRequest,
  ): Promise<VerifyCodePixKeyResponse> {
    const { userId, id, code, reason } = request;
    this.logger.debug('Verify pix key code.', { request });

    const user = new UserEntity({ uuid: userId });

    const pixKey = await this.usecase.execute(user, id, code, reason);

    return verifyCodePixKeyPresenter(pixKey);
  }
}
