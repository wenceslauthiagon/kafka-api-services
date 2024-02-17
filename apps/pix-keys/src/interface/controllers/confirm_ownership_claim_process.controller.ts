import { Logger } from 'winston';
import {
  PixKey,
  PixKeyRepository,
  KeyState,
  KeyType,
} from '@zro/pix-keys/domain';
import {
  PixKeyGateway,
  ConfirmOwnershipClaimProcessUseCase as UseCase,
} from '@zro/pix-keys/application';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export interface ConfirmOwnershipClaimProcessRequest {
  key: string;
}

export interface ConfirmOwnershipClaimProcessResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

function confirmOwnershipClaimProcessPresenter(
  pixKey: PixKey,
): ConfirmOwnershipClaimProcessResponse {
  if (!pixKey) return null;

  const response: ConfirmOwnershipClaimProcessResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}

export class ConfirmOwnershipClaimProcessController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    pspGateway: PixKeyGateway,
    ispb: string,
  ) {
    this.logger = logger.child({
      context: ConfirmOwnershipClaimProcessController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(
      this.logger,
      pixKeyRepository,
      eventEmitter,
      pspGateway,
      ispb,
    );
  }

  async execute(
    request: ConfirmOwnershipClaimProcessRequest,
  ): Promise<ConfirmOwnershipClaimProcessResponse> {
    const { key } = request;
    this.logger.debug('Confirm ownership process.', { request });

    const pixKey = await this.usecase.execute(key);

    return confirmOwnershipClaimProcessPresenter(pixKey);
  }
}
