import { Logger } from 'winston';
import {
  PixKey,
  PixKeyRepository,
  KeyState,
  KeyType,
} from '@zro/pix-keys/domain';
import { ConfirmPortabilityClaimProcessUseCase as UseCase } from '@zro/pix-keys/application';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export interface ConfirmPortabilityClaimProcessRequest {
  key: string;
}

export interface ConfirmPortabilityClaimProcessResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

function confirmPortabilityClaimProcessPresenter(
  pixKey: PixKey,
): ConfirmPortabilityClaimProcessResponse {
  if (!pixKey) return null;

  const response: ConfirmPortabilityClaimProcessResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}

export class ConfirmPortabilityClaimProcessController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: ConfirmPortabilityClaimProcessController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(this.logger, pixKeyRepository, eventEmitter);
  }

  async execute(
    request: ConfirmPortabilityClaimProcessRequest,
  ): Promise<ConfirmPortabilityClaimProcessResponse> {
    const { key } = request;
    this.logger.debug('Confirm portability process.', { request });

    const pixKey = await this.usecase.execute(key);

    return confirmPortabilityClaimProcessPresenter(pixKey);
  }
}
