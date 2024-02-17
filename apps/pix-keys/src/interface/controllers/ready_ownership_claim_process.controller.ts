import { Logger } from 'winston';
import {
  PixKey,
  PixKeyRepository,
  KeyState,
  KeyType,
  PixKeyClaimRepository,
} from '@zro/pix-keys/domain';
import { ReadyOwnershipClaimProcessUseCase as UseCase } from '@zro/pix-keys/application';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export interface ReadyOwnershipClaimProcessRequest {
  key: string;
}

export interface ReadyOwnershipClaimProcessResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

function readyOwnershipClaimProcessPresenter(
  pixKey: PixKey,
): ReadyOwnershipClaimProcessResponse {
  if (!pixKey) return null;

  const response: ReadyOwnershipClaimProcessResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}

export class ReadyOwnershipClaimProcessController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
    pixKeyClaimRepository: PixKeyClaimRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: ReadyOwnershipClaimProcessController.name,
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
    request: ReadyOwnershipClaimProcessRequest,
  ): Promise<ReadyOwnershipClaimProcessResponse> {
    const { key } = request;
    this.logger.debug('Ready ownership process.', { request });

    const pixKey = await this.usecase.execute(key);

    return readyOwnershipClaimProcessPresenter(pixKey);
  }
}
