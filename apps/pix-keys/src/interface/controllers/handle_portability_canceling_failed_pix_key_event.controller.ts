import { Logger } from 'winston';
import {
  PixKeyEvent,
  HandlePortabilityCancelingFailedPixKeyEventUseCase as UseCase,
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

export type HandlePortabilityCancelingFailedPixKeyEventRequest = PixKeyEvent;

export interface HandlePortabilityCancelingFailedPixKeyEventResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

export class HandlePortabilityCancelingFailedPixKeyEventController {
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
      context: HandlePortabilityCancelingFailedPixKeyEventController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(this.logger, pixKeyRepository, eventEmitter);
  }

  async execute(
    request: HandlePortabilityCancelingFailedPixKeyEventRequest,
  ): Promise<HandlePortabilityCancelingFailedPixKeyEventResponse> {
    this.logger.debug('Handle portability canceling failed event by Pix ID.', {
      request,
    });
    const { id } = request;

    const pixKey = await this.usecase.execute(id);

    return handlePortabilityCancelingFailedPixKeyEventPresenter(pixKey);
  }
}

export function handlePortabilityCancelingFailedPixKeyEventPresenter(
  pixKey: PixKey,
): HandlePortabilityCancelingFailedPixKeyEventResponse {
  if (!pixKey) return null;

  const response: HandlePortabilityCancelingFailedPixKeyEventResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}
