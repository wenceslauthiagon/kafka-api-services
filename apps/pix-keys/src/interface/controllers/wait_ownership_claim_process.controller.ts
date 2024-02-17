import { Logger } from 'winston';
import {
  PixKey,
  PixKeyRepository,
  KeyState,
  KeyType,
  PixKeyClaimRepository,
} from '@zro/pix-keys/domain';
import { WaitOwnershipClaimProcessUseCase as UseCase } from '@zro/pix-keys/application';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export interface WaitOwnershipClaimProcessRequest {
  key: string;
}

export interface WaitOwnershipClaimProcessResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

function waitOwnershipClaimProcessPresenter(
  pixKey: PixKey,
): WaitOwnershipClaimProcessResponse {
  if (!pixKey) return null;

  const response: WaitOwnershipClaimProcessResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}

export class WaitOwnershipClaimProcessController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
    pixKeyClaimRepository: PixKeyClaimRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: WaitOwnershipClaimProcessController.name,
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
    request: WaitOwnershipClaimProcessRequest,
  ): Promise<WaitOwnershipClaimProcessResponse> {
    const { key } = request;
    this.logger.debug('Wait ownership process.', { request });

    const pixKey = await this.usecase.execute(key);

    return waitOwnershipClaimProcessPresenter(pixKey);
  }
}
