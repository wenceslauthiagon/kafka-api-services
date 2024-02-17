import { Logger } from 'winston';
import { IsEnum, IsString, IsUUID, MaxLength } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  ClaimStatusType,
  ClaimType,
  KeyState,
  PixKeyClaim,
  PixKeyClaimEntity,
  PixKeyClaimRepository,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import {
  InvalidPixKeyClaimFlowException,
  PixKeyClaimEvent,
  PixKeyGateway,
  PixKeyNotFoundException,
} from '@zro/pix-keys/application';
import {
  PixKeyEventEmitterControllerInterface,
  ConfirmPortabilityClaimProcessController,
  CancelPortabilityClaimProcessController,
  CompletePortabilityClaimProcessController,
  WaitOwnershipClaimProcessController,
  ConfirmOwnershipClaimProcessController,
  CancelOwnershipClaimProcessController,
  CompleteOwnershipClaimProcessController,
  ReadyOwnershipClaimProcessController,
  ReadyPortabilityClaimProcessController,
  CompleteClosingClaimProcessController,
  WaitPortabilityClaimProcessController,
} from '@zro/pix-keys/interface';

type THandleReceiveReadyPixKeyClaimEventRequest = PixKeyClaimEvent;

export class HandleReceiveReadyPixKeyClaimEventRequest
  extends AutoValidator
  implements THandleReceiveReadyPixKeyClaimEventRequest
{
  @IsUUID(4)
  id: string;

  @IsString()
  @MaxLength(77)
  key: string;

  @IsEnum(ClaimType)
  type: ClaimType;

  @IsEnum(ClaimStatusType)
  status: ClaimStatusType;

  constructor(props: THandleReceiveReadyPixKeyClaimEventRequest) {
    super(props);
  }
}

export class HandleReceiveReadyPixKeyClaimController {
  private confirmPortabilityClaimProcessController: ConfirmPortabilityClaimProcessController;
  private cancelPortabilityClaimProcessController: CancelPortabilityClaimProcessController;
  private completePortabilityClaimProcessController: CompletePortabilityClaimProcessController;
  private waitOwnershipClaimProcessController: WaitOwnershipClaimProcessController;
  private confirmOwnershipClaimProcessController: ConfirmOwnershipClaimProcessController;
  private cancelOwnershipClaimProcessController: CancelOwnershipClaimProcessController;
  private completeOwnershipClaimProcessController: CompleteOwnershipClaimProcessController;
  private readyOwnershipClaimProcessController: ReadyOwnershipClaimProcessController;
  private readyPortabilityClaimProcessController: ReadyPortabilityClaimProcessController;
  private completeClosingClaimProcessController: CompleteClosingClaimProcessController;
  private waitPortabilityClaimProcessController: WaitPortabilityClaimProcessController;

  constructor(
    private logger: Logger,
    private readonly pixKeyRepository: PixKeyRepository,
    pixKeyClaimRepository: PixKeyClaimRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    pspGateway: PixKeyGateway,
    ispb: string,
  ) {
    this.logger = logger.child({
      context: HandleReceiveReadyPixKeyClaimController.name,
    });

    this.confirmPortabilityClaimProcessController =
      new ConfirmPortabilityClaimProcessController(
        this.logger,
        pixKeyRepository,
        serviceEventEmitter,
      );
    this.cancelPortabilityClaimProcessController =
      new CancelPortabilityClaimProcessController(
        this.logger,
        pixKeyRepository,
        pixKeyClaimRepository,
        serviceEventEmitter,
      );
    this.completePortabilityClaimProcessController =
      new CompletePortabilityClaimProcessController(
        this.logger,
        pixKeyRepository,
        pixKeyClaimRepository,
        serviceEventEmitter,
      );
    this.waitOwnershipClaimProcessController =
      new WaitOwnershipClaimProcessController(
        this.logger,
        pixKeyRepository,
        pixKeyClaimRepository,
        serviceEventEmitter,
      );
    this.confirmOwnershipClaimProcessController =
      new ConfirmOwnershipClaimProcessController(
        this.logger,
        pixKeyRepository,
        serviceEventEmitter,
        pspGateway,
        ispb,
      );
    this.cancelOwnershipClaimProcessController =
      new CancelOwnershipClaimProcessController(
        this.logger,
        pixKeyRepository,
        pixKeyClaimRepository,
        serviceEventEmitter,
      );
    this.completeOwnershipClaimProcessController =
      new CompleteOwnershipClaimProcessController(
        this.logger,
        pixKeyRepository,
        pixKeyClaimRepository,
        serviceEventEmitter,
      );
    this.readyOwnershipClaimProcessController =
      new ReadyOwnershipClaimProcessController(
        this.logger,
        pixKeyRepository,
        pixKeyClaimRepository,
        serviceEventEmitter,
      );
    this.readyPortabilityClaimProcessController =
      new ReadyPortabilityClaimProcessController(
        this.logger,
        pixKeyRepository,
        pixKeyClaimRepository,
        serviceEventEmitter,
        false,
      );
    this.completeClosingClaimProcessController =
      new CompleteClosingClaimProcessController(
        this.logger,
        pixKeyRepository,
        serviceEventEmitter,
      );
    this.waitPortabilityClaimProcessController =
      new WaitPortabilityClaimProcessController(
        this.logger,
        pixKeyRepository,
        pixKeyClaimRepository,
      );
  }

  async execute(
    request: HandleReceiveReadyPixKeyClaimEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle receive pix key claim request.', { request });

    const [pixKey] = await this.pixKeyRepository.getByKeyAndStateIsNotCanceled(
      request.key,
    );

    this.logger.debug('Pix key found by key.', { pixKey });

    if (!pixKey) {
      throw new PixKeyNotFoundException({ key: request.key });
    }

    const claim = new PixKeyClaimEntity({
      id: request.id,
      key: request.key,
      type: request.type,
      status: request.status,
    });

    pixKey.claim = claim;
    await this.pixKeyRepository.update(pixKey);

    this.logger.debug('PixKey updated with claim.', { pixKey });

    switch (pixKey.state) {
      case KeyState.PORTABILITY_STARTED:
        this.logger.info('Handle Portability Started process.', { claim });
        return this.handlePortabilityStarted(claim);
      case KeyState.PORTABILITY_CONFIRMED:
        this.logger.info('Handle Portability Confirmed process.', { claim });
        return this.handlePortabilityConfirmed(claim);
      case KeyState.OWNERSHIP_STARTED:
        this.logger.info('Handle Ownership Started process.', { claim });
        return this.handleOwnershipStarted(claim);
      case KeyState.OWNERSHIP_WAITING:
        this.logger.info('Handle Ownership Waiting process.', { claim });
        return this.handleOwnershipWaiting(claim);
      case KeyState.OWNERSHIP_CONFIRMED:
        this.logger.info('Handle Ownership Confirmed process.', { claim });
        return this.handleOwnershipConfirmed(claim);
      case KeyState.READY:
      case KeyState.ADD_KEY_READY:
      case KeyState.PORTABILITY_READY:
      case KeyState.OWNERSHIP_READY:
        this.logger.info('Handle Ready process.', { claim });
        return this.handleReady(claim);
      case KeyState.CLAIM_CLOSING:
        this.logger.info('Handle Claim Closing process.', { claim });
        return this.handleClaimClosing(claim);
      default:
        throw new InvalidPixKeyClaimFlowException(claim);
    }
  }

  private async handlePortabilityStarted(
    pixKeyClaim: PixKeyClaim,
  ): Promise<void> {
    if (pixKeyClaim.type === ClaimType.OWNERSHIP) {
      throw new InvalidPixKeyClaimFlowException(pixKeyClaim);
    } else if (pixKeyClaim.type === ClaimType.PORTABILITY) {
      switch (pixKeyClaim.status) {
        case ClaimStatusType.CONFIRMED:
          const confirmResponse =
            await this.confirmPortabilityClaimProcessController.execute({
              key: pixKeyClaim.key,
            });

          this.logger.info('Portability process confirm.', {
            response: confirmResponse,
          });
          break;
        case ClaimStatusType.CANCELLED: //CLOSING
          const cancelResponse =
            await this.cancelPortabilityClaimProcessController.execute({
              key: pixKeyClaim.key,
            });

          this.logger.info('Portability process cancel.', {
            response: cancelResponse,
          });
          break;
        case ClaimStatusType.COMPLETED: //CLOSING
          const completeResponse =
            await this.completePortabilityClaimProcessController.execute({
              key: pixKeyClaim.key,
            });

          this.logger.info('Portability process complete.', {
            response: completeResponse,
          });
          break;

        case ClaimStatusType.WAITING_RESOLUTION:
          const waitResponse =
            await this.waitPortabilityClaimProcessController.execute({
              key: pixKeyClaim.key,
            });
          this.logger.info('Portability process wait.', {
            response: waitResponse,
          });
          break;
      }
    }
  }

  private async handlePortabilityConfirmed(
    pixKeyClaim: PixKeyClaim,
  ): Promise<void> {
    if (pixKeyClaim.type === ClaimType.OWNERSHIP) {
      throw new InvalidPixKeyClaimFlowException(pixKeyClaim);
    } else if (pixKeyClaim.type === ClaimType.PORTABILITY) {
      switch (pixKeyClaim.status) {
        case ClaimStatusType.CANCELLED:
          const cancelResponse =
            await this.cancelPortabilityClaimProcessController.execute({
              key: pixKeyClaim.key,
            });

          this.logger.info('Portability process cancel.', {
            response: cancelResponse,
          });
          break;
        case ClaimStatusType.COMPLETED:
          const completeResponse =
            await this.completePortabilityClaimProcessController.execute({
              key: pixKeyClaim.key,
            });

          this.logger.info('Portability process complete.', {
            response: completeResponse,
          });
          break;
        case ClaimStatusType.WAITING_RESOLUTION:
          throw new InvalidPixKeyClaimFlowException(pixKeyClaim);
        default:
          this.logger.debug('No case match.', { pixKeyClaim });
      }
    }
  }

  private async handleOwnershipStarted(
    pixKeyClaim: PixKeyClaim,
  ): Promise<void> {
    if (pixKeyClaim.type === ClaimType.PORTABILITY) {
      throw new InvalidPixKeyClaimFlowException(pixKeyClaim);
    } else if (pixKeyClaim.type === ClaimType.OWNERSHIP) {
      switch (pixKeyClaim.status) {
        case ClaimStatusType.WAITING_RESOLUTION:
          const waitResponse =
            await this.waitOwnershipClaimProcessController.execute({
              key: pixKeyClaim.key,
            });

          this.logger.info('Ownership process wait.', {
            response: waitResponse,
          });
          break;
        case ClaimStatusType.CONFIRMED:
          const confirmResponse =
            await this.confirmOwnershipClaimProcessController.execute({
              key: pixKeyClaim.key,
            });

          this.logger.info('Ownership process confirm.', {
            response: confirmResponse,
          });
          break;
        case ClaimStatusType.CANCELLED:
          const cancelResponse =
            await this.cancelOwnershipClaimProcessController.execute({
              key: pixKeyClaim.key,
            });

          this.logger.info('Ownership process cancel.', {
            response: cancelResponse,
          });
          break;
        case ClaimStatusType.COMPLETED:
          const completeResponse =
            await this.completeOwnershipClaimProcessController.execute({
              key: pixKeyClaim.key,
            });

          this.logger.info('Ownership process complete.', {
            response: completeResponse,
          });
          break;
        default:
          this.logger.debug('No case match.', { pixKeyClaim });
      }
    }
  }

  private async handleOwnershipWaiting(
    pixKeyClaim: PixKeyClaim,
  ): Promise<void> {
    if (pixKeyClaim.type === ClaimType.PORTABILITY) {
      throw new InvalidPixKeyClaimFlowException(pixKeyClaim);
    } else if (pixKeyClaim.type === ClaimType.OWNERSHIP) {
      switch (pixKeyClaim.status) {
        case ClaimStatusType.CONFIRMED:
          const confirmResponse =
            await this.confirmOwnershipClaimProcessController.execute({
              key: pixKeyClaim.key,
            });

          this.logger.info('Ownership process confirm.', {
            response: confirmResponse,
          });
          break;
        case ClaimStatusType.CANCELLED:
          const cancelResponse =
            await this.cancelOwnershipClaimProcessController.execute({
              key: pixKeyClaim.key,
            });

          this.logger.info('Ownership process cancel.', {
            response: cancelResponse,
          });
          break;
        case ClaimStatusType.COMPLETED:
          const completeResponse =
            await this.completeOwnershipClaimProcessController.execute({
              key: pixKeyClaim.key,
            });

          this.logger.info('Ownership process complete.', {
            response: completeResponse,
          });
          break;
        default:
          this.logger.debug('No case match.', { pixKeyClaim });
      }
    }
  }

  private async handleOwnershipConfirmed(
    pixKeyClaim: PixKeyClaim,
  ): Promise<void> {
    if (pixKeyClaim.type === ClaimType.PORTABILITY) {
      throw new InvalidPixKeyClaimFlowException(pixKeyClaim);
    } else if (pixKeyClaim.type === ClaimType.OWNERSHIP) {
      switch (pixKeyClaim.status) {
        case ClaimStatusType.COMPLETED:
          const completeResponse =
            await this.completeOwnershipClaimProcessController.execute({
              key: pixKeyClaim.key,
            });

          this.logger.info('Ownership process complete.', {
            response: completeResponse,
          });
          break;
        case ClaimStatusType.CANCELLED:
          const cancelResponse =
            await this.cancelOwnershipClaimProcessController.execute({
              key: pixKeyClaim.key,
            });

          this.logger.info('Ownership process cancel.', {
            response: cancelResponse,
          });
          break;
        default:
          this.logger.debug('No case match.', { pixKeyClaim });
      }
    }
  }

  private async handleReady(pixKeyClaim: PixKeyClaim): Promise<void> {
    if (
      [ClaimStatusType.COMPLETED, ClaimStatusType.CANCELLED].includes(
        pixKeyClaim.status,
      )
    ) {
      throw new InvalidPixKeyClaimFlowException(pixKeyClaim);
    } else if (
      [
        ClaimStatusType.OPEN,
        ClaimStatusType.WAITING_RESOLUTION,
        ClaimStatusType.CONFIRMED,
      ].includes(pixKeyClaim.status)
    ) {
      switch (pixKeyClaim.type) {
        case ClaimType.OWNERSHIP:
          const ownershipResponse =
            await this.readyOwnershipClaimProcessController.execute({
              key: pixKeyClaim.key,
            });

          this.logger.info('Ownership process ready.', {
            response: ownershipResponse,
          });
          break;
        case ClaimType.PORTABILITY:
          const portabilityResponse =
            await this.readyPortabilityClaimProcessController.execute({
              key: pixKeyClaim.key,
            });

          this.logger.info('Portability process ready.', {
            response: portabilityResponse,
          });
          break;
        default:
          this.logger.debug('No case match.', { pixKeyClaim });
      }
    }
  }

  private async handleClaimClosing(pixKeyClaim: PixKeyClaim): Promise<void> {
    if (
      pixKeyClaim.status === ClaimStatusType.CANCELLED ||
      pixKeyClaim.type === ClaimType.PORTABILITY
    ) {
      throw new InvalidPixKeyClaimFlowException(pixKeyClaim);
    } else if (pixKeyClaim.type === ClaimType.OWNERSHIP) {
      switch (pixKeyClaim.status) {
        case ClaimStatusType.COMPLETED:
          const completeResponse =
            await this.completeClosingClaimProcessController.execute({
              key: pixKeyClaim.key,
            });

          this.logger.info('Closing claim completed.', {
            response: completeResponse,
          });
          break;
        default:
          this.logger.debug('No case match.', { pixKeyClaim });
      }
    }
  }
}
