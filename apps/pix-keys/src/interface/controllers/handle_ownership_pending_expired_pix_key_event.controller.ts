import { Logger } from 'winston';
import {
  HandleOwnershipPendingExpiredPixKeyUseCase as UseCase,
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

export type HandleOwnershipPendingExpiredPixKeyEventRequest = PixKeyEvent;

export interface HandleOwnershipPendingExpiredPixKeyEventResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

export class HandleOwnershipPendingExpiredPixKeyEventController {
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
      context: HandleOwnershipPendingExpiredPixKeyEventController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(this.logger, pixKeyRepository, eventEmitter);
  }

  async execute(
    request: HandleOwnershipPendingExpiredPixKeyEventRequest,
  ): Promise<HandleOwnershipPendingExpiredPixKeyEventResponse> {
    const { id } = request;
    this.logger.debug('Handle ownership pending expired event by Pix ID.', {
      request,
    });

    const pixKey = await this.usecase.execute(id);

    return handleOwnershipPendingExpiredPixKeyEventPresenter(pixKey);
  }
}

function handleOwnershipPendingExpiredPixKeyEventPresenter(
  pixKey: PixKey,
): HandleOwnershipPendingExpiredPixKeyEventResponse {
  if (!pixKey) return null;

  const response: HandleOwnershipPendingExpiredPixKeyEventResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}
