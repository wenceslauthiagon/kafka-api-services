import { Logger } from 'winston';
import {
  PixKey,
  PixKeyRepository,
  KeyState,
  KeyType,
  PixKeyClaimRepository,
} from '@zro/pix-keys/domain';
import { CompleteOwnershipClaimProcessUseCase as UseCase } from '@zro/pix-keys/application';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export interface CompleteOwnershipClaimProcessRequest {
  key: string;
}

export interface CompleteOwnershipClaimProcessResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

function completeOwnershipClaimProcessPresenter(
  pixKey: PixKey,
): CompleteOwnershipClaimProcessResponse {
  if (!pixKey) return null;

  const response: CompleteOwnershipClaimProcessResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}

export class CompleteOwnershipClaimProcessController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
    pixKeyClaimRepository: PixKeyClaimRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: CompleteOwnershipClaimProcessController.name,
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
    request: CompleteOwnershipClaimProcessRequest,
  ): Promise<CompleteOwnershipClaimProcessResponse> {
    const { key } = request;
    this.logger.debug('Complete ownership process.', { request });

    const pixKey = await this.usecase.execute(key);

    return completeOwnershipClaimProcessPresenter(pixKey);
  }
}
