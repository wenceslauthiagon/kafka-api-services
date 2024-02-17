import { Logger } from 'winston';
import { UserEntity } from '@zro/users/domain';
import { PixKeyEntity } from '@zro/pix-keys/domain';
import { PixKeyEvent } from '@zro/pix-keys/application';
import {
  QrCodeStatic,
  QrCodeStaticRepository,
  QrCodeStaticState,
} from '@zro/pix-payments/domain';
import { HandleCanceledPixKeyQrCodeStaticEventUseCase as UseCase } from '@zro/pix-payments/application';
import {
  QrCodeStaticEventEmitterController,
  QrCodeStaticEventEmitterControllerInterface,
} from '../events/qr_code_static.emitter';

export type HandleCanceledPixKeyQrCodeStaticEventRequest = PixKeyEvent;

export interface HandleCanceledPixKeyQrCodeStaticEventResponse {
  id: string;
  txId: string;
  emv: string;
  keyId: string;
  documentValue: number;
  description: string;
  summary: string;
  state: QrCodeStaticState;
  createdAt: Date;
}

export class HandleCanceledPixKeyQrCodeStaticEventController {
  /**
   * Handler triggered when an error is thrown.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param qrCodeStaticRepository QrCodeStatic repository.
   * @param serviceEventEmitter QrCodeStatic event emitter.
   * @param logger Global logger.
   */
  constructor(
    qrCodeStaticRepository: QrCodeStaticRepository,
    serviceEventEmitter: QrCodeStaticEventEmitterControllerInterface,
    private logger: Logger,
  ) {
    this.logger = logger.child({
      context: HandleCanceledPixKeyQrCodeStaticEventController.name,
    });

    const eventEmitter = new QrCodeStaticEventEmitterController(
      serviceEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      qrCodeStaticRepository,
      eventEmitter,
    );
  }

  async execute(
    request: HandleCanceledPixKeyQrCodeStaticEventRequest,
  ): Promise<HandleCanceledPixKeyQrCodeStaticEventResponse[]> {
    const { id, userId } = request;
    this.logger.debug('Handle canceled pixKey event.', { request });

    const user = new UserEntity({ uuid: userId });
    const pixKey = new PixKeyEntity({ id, user });
    const qrCodeStatic = await this.usecase.execute(user, pixKey);

    return handleCanceledPixKeyQrCodeStaticEventPresenter(qrCodeStatic);
  }
}

function handleCanceledPixKeyQrCodeStaticEventPresenter(
  qrCodeStatics: QrCodeStatic[],
): HandleCanceledPixKeyQrCodeStaticEventResponse[] {
  if (!qrCodeStatics) return null;

  const response =
    qrCodeStatics.map<HandleCanceledPixKeyQrCodeStaticEventResponse>(
      (qrCodeStatic) => ({
        id: qrCodeStatic.id,
        txId: qrCodeStatic.txId,
        emv: qrCodeStatic.emv,
        keyId: qrCodeStatic.pixKey.id,
        documentValue: qrCodeStatic.documentValue,
        description: qrCodeStatic.description,
        summary: qrCodeStatic.summary,
        state: qrCodeStatic.state,
        createdAt: qrCodeStatic.createdAt,
      }),
    );

  return response;
}
