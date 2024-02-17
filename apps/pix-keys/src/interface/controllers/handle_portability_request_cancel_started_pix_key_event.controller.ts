import { Logger } from 'winston';
import {
  HandlePortabilityRequestCancelStartedPixKeyEventUseCase as UseCase,
  PixKeyEvent,
} from '@zro/pix-keys/application';
import {
  PixKey,
  PixKeyRepository,
  KeyState,
  KeyType,
} from '@zro/pix-keys/domain';
import {
  PixKeyEventEmitterControllerInterface,
  PixKeyEventEmitterController,
} from '@zro/pix-keys/interface';

export type HandlePortabilityRequestCancelStartedPixKeyEventRequest =
  PixKeyEvent;

export interface HandlePortabilityRequestCancelStartedPixKeyEventResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

export class HandlePortabilityRequestCancelStartedPixKeyEventController {
  /**
   * Handler triggered when claim was updated successfully to DICT.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param pixKeyRepository PixKey repository.
   * @param logger Global logger.
   */
  constructor(
    pixKeyRepository: PixKeyRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    private logger: Logger,
  ) {
    this.logger = logger.child({
      context: HandlePortabilityRequestCancelStartedPixKeyEventController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(this.logger, pixKeyRepository, eventEmitter);
  }

  async execute(
    request: HandlePortabilityRequestCancelStartedPixKeyEventRequest,
  ): Promise<HandlePortabilityRequestCancelStartedPixKeyEventResponse> {
    const { id } = request;
    this.logger.debug('Handle portability cancel started event by Pix ID.', {
      request,
    });

    const pixKey = await this.usecase.execute(id);

    return handlePortabilityRequestCancelStartedPixKeyEventPresenter(pixKey);
  }
}

function handlePortabilityRequestCancelStartedPixKeyEventPresenter(
  pixKey: PixKey,
): HandlePortabilityRequestCancelStartedPixKeyEventResponse {
  if (!pixKey) return null;

  const response: HandlePortabilityRequestCancelStartedPixKeyEventResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}
