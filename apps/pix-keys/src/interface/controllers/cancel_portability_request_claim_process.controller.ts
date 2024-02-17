import { Logger } from 'winston';
import { UserEntity } from '@zro/users/domain';
import {
  PixKey,
  PixKeyRepository,
  KeyState,
  KeyType,
  ClaimReasonType,
} from '@zro/pix-keys/domain';
import { CancelPortabilityRequestClaimProcessUseCase as UseCase } from '@zro/pix-keys/application';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export interface CancelPortabilityRequestClaimProcessRequest {
  userId: string;
  id: string;
  reason: ClaimReasonType;
}

export interface CancelPortabilityRequestClaimProcessResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

function cancelPortabilityRequestClaimProcessPresenter(
  pixKey: PixKey,
): CancelPortabilityRequestClaimProcessResponse {
  if (!pixKey) return null;

  const response: CancelPortabilityRequestClaimProcessResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}

export class CancelPortabilityRequestClaimProcessController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: CancelPortabilityRequestClaimProcessController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(this.logger, pixKeyRepository, eventEmitter);
  }

  async execute(
    request: CancelPortabilityRequestClaimProcessRequest,
  ): Promise<CancelPortabilityRequestClaimProcessResponse> {
    const { userId, id, reason } = request;
    this.logger.debug('Cancel portability process.', { request });

    const user = new UserEntity({ uuid: userId });

    const pixKey = await this.usecase.execute(user, id, reason);

    return cancelPortabilityRequestClaimProcessPresenter(pixKey);
  }
}
