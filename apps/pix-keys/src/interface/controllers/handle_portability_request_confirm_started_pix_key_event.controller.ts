import { Logger } from 'winston';
import {
  HandlePortabilityRequestConfirmStartedPixKeyEventUseCase as UseCase,
  PixKeyEvent,
} from '@zro/pix-keys/application';
import {
  PixKey,
  PixKeyRepository,
  KeyState,
  KeyType,
  PixKeyClaimRepository,
} from '@zro/pix-keys/domain';
import {
  PixKeyEventEmitterControllerInterface,
  PixKeyEventEmitterController,
} from '@zro/pix-keys/interface';

export type HandlePortabilityRequestConfirmStartedPixKeyEventRequest =
  PixKeyEvent;

export interface HandlePortabilityRequestConfirmStartedPixKeyEventResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

export class HandlePortabilityRequestConfirmStartedPixKeyEventController {
  /**
   * Handler triggered when claim was updated successfully to DICT.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param pixKeyRepository PixKey repository.
   * @param pixKeyClaimRepository PixKeyClaim repository.
   * @param logger Global logger.
   */
  constructor(
    pixKeyRepository: PixKeyRepository,
    pixKeyClaimRepository: PixKeyClaimRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    private logger: Logger,
  ) {
    this.logger = logger.child({
      context: HandlePortabilityRequestConfirmStartedPixKeyEventController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(
      this.logger,
      pixKeyRepository,
      pixKeyClaimRepository,
      eventEmitter,
    );
  }

  async execute(
    request: HandlePortabilityRequestConfirmStartedPixKeyEventRequest,
  ): Promise<HandlePortabilityRequestConfirmStartedPixKeyEventResponse> {
    const { id } = request;
    this.logger.debug('Handle portability confirm started event by Pix ID.', {
      request,
    });

    const pixKey = await this.usecase.execute(id);

    return handlePortabilityRequestConfirmStartedPixKeyEventPresenter(pixKey);
  }
}

function handlePortabilityRequestConfirmStartedPixKeyEventPresenter(
  pixKey: PixKey,
): HandlePortabilityRequestConfirmStartedPixKeyEventResponse {
  if (!pixKey) return null;

  const response: HandlePortabilityRequestConfirmStartedPixKeyEventResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}
