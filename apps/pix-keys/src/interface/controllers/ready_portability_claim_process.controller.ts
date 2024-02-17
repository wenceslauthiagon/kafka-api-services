import { Logger } from 'winston';
import {
  PixKey,
  PixKeyRepository,
  KeyState,
  KeyType,
  PixKeyClaimRepository,
} from '@zro/pix-keys/domain';
import { ReadyPortabilityClaimProcessUseCase as UseCase } from '@zro/pix-keys/application';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export interface ReadyPortabilityClaimProcessRequest {
  key: string;
}

export interface ReadyPortabilityClaimProcessResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

function readyPortabilityClaimProcessPresenter(
  pixKey: PixKey,
): ReadyPortabilityClaimProcessResponse {
  if (!pixKey) return null;

  const response: ReadyPortabilityClaimProcessResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}

export class ReadyPortabilityClaimProcessController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
    pixKeyClaimRepository: PixKeyClaimRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    autoApprovePortabilityRequest: boolean,
  ) {
    this.logger = logger.child({
      context: ReadyPortabilityClaimProcessController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(
      this.logger,
      pixKeyRepository,
      pixKeyClaimRepository,
      eventEmitter,
      autoApprovePortabilityRequest,
    );
  }

  async execute(
    request: ReadyPortabilityClaimProcessRequest,
  ): Promise<ReadyPortabilityClaimProcessResponse> {
    const { key } = request;
    this.logger.debug('Ready portability process.', { request });

    const pixKey = await this.usecase.execute(key);

    return readyPortabilityClaimProcessPresenter(pixKey);
  }
}
