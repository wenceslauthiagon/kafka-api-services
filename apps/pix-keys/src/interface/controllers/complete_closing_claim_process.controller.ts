import { Logger } from 'winston';
import {
  PixKey,
  PixKeyRepository,
  KeyState,
  KeyType,
} from '@zro/pix-keys/domain';
import { CompleteClosingClaimProcessUseCase as UseCase } from '@zro/pix-keys/application';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export interface CompleteClosingClaimProcessRequest {
  key: string;
}

export interface CompleteClosingClaimProcessResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

function completeClosingClaimProcessPresenter(
  pixKey: PixKey,
): CompleteClosingClaimProcessResponse {
  if (!pixKey) return null;

  const response: CompleteClosingClaimProcessResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}

export class CompleteClosingClaimProcessController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: CompleteClosingClaimProcessController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(this.logger, pixKeyRepository, eventEmitter);
  }

  async execute(
    request: CompleteClosingClaimProcessRequest,
  ): Promise<CompleteClosingClaimProcessResponse> {
    const { key } = request;
    this.logger.debug('Complete closing claim process.', { request });

    const pixKey = await this.usecase.execute(key);

    return completeClosingClaimProcessPresenter(pixKey);
  }
}
