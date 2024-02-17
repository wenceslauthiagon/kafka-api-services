import { Logger } from 'winston';
import {
  HandleDeletingFailedPixKeyEventUseCase as UseCase,
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

export type HandleDeletingFailedPixKeyEventRequest = PixKeyEvent;

export interface HandleDeletingFailedPixKeyEventResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

export class HandleDeletingFailedPixKeyEventController {
  /**
   * Handler triggered when an error is thrown.
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
      context: HandleDeletingFailedPixKeyEventController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(this.logger, pixKeyRepository, eventEmitter);
  }

  async execute(
    request: HandleDeletingFailedPixKeyEventRequest,
  ): Promise<HandleDeletingFailedPixKeyEventResponse> {
    const { id } = request;
    this.logger.debug('Handle deleted failed event by Pix ID.', { request });

    const pixKey = await this.usecase.execute(id);

    return handleDeletingFailedPixKeyEventPresenter(pixKey);
  }
}

function handleDeletingFailedPixKeyEventPresenter(
  pixKey: PixKey,
): HandleDeletingFailedPixKeyEventResponse {
  if (!pixKey) return null;

  const response: HandleDeletingFailedPixKeyEventResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}
