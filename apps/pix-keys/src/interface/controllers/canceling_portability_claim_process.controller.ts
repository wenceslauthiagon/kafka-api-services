import { Logger } from 'winston';
import { UserEntity } from '@zro/users/domain';
import {
  PixKey,
  PixKeyRepository,
  KeyState,
  KeyType,
  ClaimReasonType,
  PixKeyClaimRepository,
} from '@zro/pix-keys/domain';
import { CancelingPortabilityClaimProcessUseCase as UseCase } from '@zro/pix-keys/application';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export interface CancelingPortabilityClaimProcessRequest {
  userId: string;
  id: string;
  reason: ClaimReasonType;
}

export interface CancelingPortabilityClaimProcessResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

function cancelingPortabilityClaimProcessPresenter(
  pixKey: PixKey,
): CancelingPortabilityClaimProcessResponse {
  if (!pixKey) return null;

  const response: CancelingPortabilityClaimProcessResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}

export class CancelingPortabilityClaimProcessController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
    pixKeyClaimRepository: PixKeyClaimRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: CancelingPortabilityClaimProcessController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(
      this.logger,
      pixKeyRepository,
      pixKeyClaimRepository,
      eventEmitter,
    );
  }

  async execute(
    request: CancelingPortabilityClaimProcessRequest,
  ): Promise<CancelingPortabilityClaimProcessResponse> {
    this.logger.debug('Canceling portability process.', { request });

    const { userId, id, reason } = request;

    const user = new UserEntity({ uuid: userId });

    const pixKey = await this.usecase.execute(user, id, reason);

    return cancelingPortabilityClaimProcessPresenter(pixKey);
  }
}
