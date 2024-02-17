import { Logger } from 'winston';
import {
  PixKey,
  PixKeyRepository,
  KeyState,
  KeyType,
  PixKeyClaimRepository,
} from '@zro/pix-keys/domain';
import { CompletePortabilityClaimProcessUseCase as UseCase } from '@zro/pix-keys/application';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export interface CompletePortabilityClaimProcessRequest {
  key: string;
}

export interface CompletePortabilityClaimProcessResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

function completePortabilityClaimProcessPresenter(
  pixKey: PixKey,
): CompletePortabilityClaimProcessResponse {
  if (!pixKey) return null;

  const response: CompletePortabilityClaimProcessResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}

export class CompletePortabilityClaimProcessController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
    pixKeyClaimRepository: PixKeyClaimRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: CompletePortabilityClaimProcessController.name,
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
    request: CompletePortabilityClaimProcessRequest,
  ): Promise<CompletePortabilityClaimProcessResponse> {
    const { key } = request;
    this.logger.debug('Complete portability process.', { request });

    const pixKey = await this.usecase.execute(key);

    return completePortabilityClaimProcessPresenter(pixKey);
  }
}
