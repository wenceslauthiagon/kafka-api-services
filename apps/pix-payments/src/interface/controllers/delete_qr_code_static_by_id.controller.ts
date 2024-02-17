import { Logger } from 'winston';
import { IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import { QrCodeStatic, QrCodeStaticRepository } from '@zro/pix-payments/domain';
import { DeleteByQrCodeStaticIdUseCase as UseCase } from '@zro/pix-payments/application';
import {
  QrCodeStaticEventEmitterController,
  QrCodeStaticEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];

type TDeleteByQrCodeStaticIdRequest = Pick<QrCodeStatic, 'id'> & {
  userId: UserId;
};

export class DeleteByQrCodeStaticIdRequest
  extends AutoValidator
  implements TDeleteByQrCodeStaticIdRequest
{
  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  id: string;

  constructor(props: TDeleteByQrCodeStaticIdRequest) {
    super(props);
  }
}

export class DeleteByQrCodeStaticIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    qrCodeStaticRepository: QrCodeStaticRepository,
    eventEmitter: QrCodeStaticEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: DeleteByQrCodeStaticIdController.name,
    });

    const controllerEventEmitter = new QrCodeStaticEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      qrCodeStaticRepository,
      controllerEventEmitter,
    );
  }

  async execute(request: DeleteByQrCodeStaticIdRequest): Promise<void> {
    this.logger.debug('Delete qrCodeStatic request.', { request });

    const { id, userId } = request;

    const user = new UserEntity({ uuid: userId });

    const qrCodeStatic = await this.usecase.execute(user, id);

    this.logger.info('Delete qrCodeStatic response.', { qrCodeStatic });
  }
}
