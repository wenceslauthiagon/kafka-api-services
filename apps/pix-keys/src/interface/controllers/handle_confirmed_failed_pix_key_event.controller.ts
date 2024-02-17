import { Logger } from 'winston';
import { Failed } from '@zro/common';
import {
  HandleConfirmedFailedPixKeyEventUseCase as UseCase,
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

export type HandleConfirmedFailedPixKeyEventRequest = PixKeyEvent & {
  failed?: Failed;
};

export interface HandleConfirmedFailedPixKeyEventResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

export class HandleConfirmedFailedPixKeyEventController {
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
      context: HandleConfirmedFailedPixKeyEventController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(this.logger, pixKeyRepository, eventEmitter);
  }

  async execute(
    request: HandleConfirmedFailedPixKeyEventRequest,
  ): Promise<HandleConfirmedFailedPixKeyEventResponse> {
    this.logger.debug('Handle added failed event by Pix ID.', { request });

    const { id, failed } = request;

    const pixKey = await this.usecase.execute(id, failed);

    return handleConfirmedFailedPixKeyEventPresenter(pixKey);
  }
}

function handleConfirmedFailedPixKeyEventPresenter(
  pixKey: PixKey,
): HandleConfirmedFailedPixKeyEventResponse {
  if (!pixKey) return null;

  const response: HandleConfirmedFailedPixKeyEventResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}
