import { Logger } from 'winston';
import {
  PixKeyEvent,
  HandlePortabilityOpenedFailedPixKeyEventUseCase as UseCase,
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

export type HandlePortabilityOpenedFailedPixKeyEventRequest = PixKeyEvent;

export interface HandlePortabilityOpenedFailedPixKeyEventResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

export class HandlePortabilityOpenedFailedPixKeyEventController {
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
      context: HandlePortabilityOpenedFailedPixKeyEventController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(this.logger, pixKeyRepository, eventEmitter);
  }

  async execute(
    request: HandlePortabilityOpenedFailedPixKeyEventRequest,
  ): Promise<HandlePortabilityOpenedFailedPixKeyEventResponse> {
    const { id } = request;
    this.logger.debug('Handle portability opened failed event by Pix ID.', {
      request,
    });

    const pixKey = await this.usecase.execute(id);

    return handlePortabilityOpenedFailedPixKeyEventPresenter(pixKey);
  }
}

export function handlePortabilityOpenedFailedPixKeyEventPresenter(
  pixKey: PixKey,
): HandlePortabilityOpenedFailedPixKeyEventResponse {
  if (!pixKey) return null;

  const response: HandlePortabilityOpenedFailedPixKeyEventResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}
