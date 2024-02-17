import { Logger } from 'winston';
import {
  HandlePortabilityRequestCancelOpenedPixKeyEventUseCase as UseCase,
  PixKeyGateway,
  PixKeyReasonEvent,
} from '@zro/pix-keys/application';
import {
  PixKey,
  PixKeyRepository,
  KeyState,
  KeyType,
  PixKeyClaimRepository,
} from '@zro/pix-keys/domain';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export type HandlePortabilityRequestCancelOpenedPixKeyEventRequest =
  PixKeyReasonEvent;

export interface HandlePortabilityRequestCancelOpenedPixKeyEventResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

export class HandlePortabilityRequestCancelOpenedPixKeyEventController {
  /**
   * Handler triggered when claim was updated successfully to DICT.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param pixKeyRepository PixKey repository.
   * @param serviceEventEmitter PixKey event emitter.
   * @param pspGateway PixKey psp gateway.
   * @param logger Global logger.
   * @param ispb ispb
   * @param pixKeyClaimRepository Pix key claim repository
   */
  constructor(
    pixKeyRepository: PixKeyRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    pspGateway: PixKeyGateway,
    private logger: Logger,
    ispb: string,
    pixKeyClaimRepository: PixKeyClaimRepository,
  ) {
    this.logger = logger.child({
      context: HandlePortabilityRequestCancelOpenedPixKeyEventController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(
      this.logger,
      pixKeyRepository,
      eventEmitter,
      pspGateway,
      ispb,
      pixKeyClaimRepository,
    );
  }

  async execute(
    request: HandlePortabilityRequestCancelOpenedPixKeyEventRequest,
  ): Promise<HandlePortabilityRequestCancelOpenedPixKeyEventResponse> {
    const { id, reason } = request;
    this.logger.debug('Handle portability cancel opened event by Pix ID.', {
      request,
    });

    const pixKey = await this.usecase.execute(id, reason);

    return handlePortabilityRequestCancelOpenedPixKeyEventPresenter(pixKey);
  }
}

function handlePortabilityRequestCancelOpenedPixKeyEventPresenter(
  pixKey: PixKey,
): HandlePortabilityRequestCancelOpenedPixKeyEventResponse {
  if (!pixKey) return null;

  const response: HandlePortabilityRequestCancelOpenedPixKeyEventResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}
