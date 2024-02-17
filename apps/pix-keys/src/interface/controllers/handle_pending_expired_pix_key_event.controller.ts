import { Logger } from 'winston';
import {
  HandlePendingExpiredPixKeyUseCase as UseCase,
  PixKeyEvent,
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

export type HandlePendingExpiredPixKeyEventRequest = PixKeyEvent;

export interface HandlePendingExpiredPixKeyEventResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

export class HandlePendingExpiredPixKeyEventController {
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
      context: HandlePendingExpiredPixKeyEventController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(this.logger, pixKeyRepository, eventEmitter);
  }

  async execute(
    request: HandlePendingExpiredPixKeyEventRequest,
  ): Promise<HandlePendingExpiredPixKeyEventResponse> {
    const { id } = request;
    this.logger.debug('Handle pending expired event by Pix ID.', { request });

    const pixKey = await this.usecase.execute(id);

    return handlePendingExpiredPixKeyEventPresenter(pixKey);
  }
}

function handlePendingExpiredPixKeyEventPresenter(
  pixKey: PixKey,
): HandlePendingExpiredPixKeyEventResponse {
  if (!pixKey) return null;

  const response: HandlePendingExpiredPixKeyEventResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}
