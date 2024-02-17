import { Logger } from 'winston';
import {
  PixKeyEvent,
  HandlePortabilityRequestCancelOpenedFailedPixKeyEventUseCase as UseCase,
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

export type HandlePortabilityRequestCancelOpenedFailedPixKeyEventRequest =
  PixKeyEvent;

export interface HandlePortabilityRequestCancelOpenedFailedPixKeyEventResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

export class HandlePortabilityRequestCancelOpenedFailedPixKeyEventController {
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
      context:
        HandlePortabilityRequestCancelOpenedFailedPixKeyEventController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(this.logger, pixKeyRepository, eventEmitter);
  }

  async execute(
    request: HandlePortabilityRequestCancelOpenedFailedPixKeyEventRequest,
  ): Promise<HandlePortabilityRequestCancelOpenedFailedPixKeyEventResponse> {
    const { id } = request;
    this.logger.debug(
      'Handle portability cancel opened failed event by Pix ID.',
      {
        request,
      },
    );

    const pixKey = await this.usecase.execute(id);

    return handlePortabilityRequestCancelOpenedFailedPixKeyEventPresenter(
      pixKey,
    );
  }
}

export function handlePortabilityRequestCancelOpenedFailedPixKeyEventPresenter(
  pixKey: PixKey,
): HandlePortabilityRequestCancelOpenedFailedPixKeyEventResponse {
  if (!pixKey) return null;

  const response: HandlePortabilityRequestCancelOpenedFailedPixKeyEventResponse =
    {
      id: pixKey.id,
      key: pixKey.key,
      type: pixKey.type,
      state: pixKey.state,
      createdAt: pixKey.createdAt,
    };

  return response;
}
