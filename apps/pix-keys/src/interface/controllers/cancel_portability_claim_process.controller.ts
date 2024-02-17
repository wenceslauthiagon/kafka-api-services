import { Logger } from 'winston';
import {
  PixKey,
  PixKeyRepository,
  KeyState,
  KeyType,
  PixKeyClaimRepository,
} from '@zro/pix-keys/domain';
import { CancelPortabilityClaimProcessUseCase as UseCase } from '@zro/pix-keys/application';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export interface CancelPortabilityClaimProcessRequest {
  key: string;
}

export interface CancelPortabilityClaimProcessResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

function cancelPortabilityClaimProcessPresenter(
  pixKey: PixKey,
): CancelPortabilityClaimProcessResponse {
  if (!pixKey) return null;

  const response: CancelPortabilityClaimProcessResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}

export class CancelPortabilityClaimProcessController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
    pixKeyClaimRepository: PixKeyClaimRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: CancelPortabilityClaimProcessController.name,
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
    request: CancelPortabilityClaimProcessRequest,
  ): Promise<CancelPortabilityClaimProcessResponse> {
    const { key } = request;
    this.logger.debug('Cancel portability process.', { request });

    const pixKey = await this.usecase.execute(key);

    return cancelPortabilityClaimProcessPresenter(pixKey);
  }
}
