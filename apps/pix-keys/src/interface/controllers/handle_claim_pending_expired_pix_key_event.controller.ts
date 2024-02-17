import { Logger } from 'winston';
import {
  HandleClaimPendingExpiredPixKeyUseCase as UseCase,
  PixKeyReasonEvent,
} from '@zro/pix-keys/application';
import {
  PixKey,
  PixKeyRepository,
  KeyState,
  KeyType,
} from '@zro/pix-keys/domain';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export type HandleClaimPendingExpiredPixKeyEventRequest = PixKeyReasonEvent;

export interface HandleClaimPendingExpiredPixKeyEventResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

export class HandleClaimPendingExpiredPixKeyEventController {
  /**
   * Handler triggered when key was expired.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param pixKeyRepository PixKey repository.
   * @param serviceEventEmitter PixKey event emitter.
   * @param logger Global logger.
   */
  constructor(
    pixKeyRepository: PixKeyRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    private logger: Logger,
  ) {
    this.logger = logger.child({
      context: HandleClaimPendingExpiredPixKeyEventController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(this.logger, pixKeyRepository, eventEmitter);
  }

  async execute(
    request: HandleClaimPendingExpiredPixKeyEventRequest,
  ): Promise<HandleClaimPendingExpiredPixKeyEventResponse> {
    const { id, reason } = request;
    this.logger.debug('Handle claim pending expired event by Pix ID.', {
      request,
    });

    const pixKey = await this.usecase.execute(id, reason);

    return handleClaimPendingExpiredPixKeyEventPresenter(pixKey);
  }
}

function handleClaimPendingExpiredPixKeyEventPresenter(
  pixKey: PixKey,
): HandleClaimPendingExpiredPixKeyEventResponse {
  if (!pixKey) return null;

  const response: HandleClaimPendingExpiredPixKeyEventResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}
