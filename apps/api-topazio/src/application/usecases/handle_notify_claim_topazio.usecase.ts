import { Logger } from 'winston';
import { isDefined } from 'class-validator';
import { MissingDataException } from '@zro/common';
import {
  NotifyStateType,
  NotifyClaimEntity,
  NotifyClaimRepository,
} from '@zro/api-topazio/domain';
import { KeyState, ClaimStatusType, ClaimType } from '@zro/pix-keys/domain';
import { PixKeyNotFoundException } from '@zro/pix-keys/application';
import {
  NotifyClaimInvalidFlowException,
  PixKeyService,
} from '@zro/api-topazio/application';

export class HandleNotifyClaimTopazioEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixKeyService Service to access Kafka.
   */
  constructor(
    private logger: Logger,
    private readonly pixKeyService: PixKeyService,
    private readonly notifyClaimRepository: NotifyClaimRepository,
  ) {
    this.logger = logger.child({
      context: HandleNotifyClaimTopazioEventUseCase.name,
    });
  }

  /**
   * Notify claim and send to pixKey.
   *
   * @returns {PixKey} Key updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {PixKeyNotFoundException} Thrown when key id was not found.
   */
  async execute(payload: NotifyClaimEntity): Promise<void> {
    this.logger.debug('Notify Claim received.', { notifyClaim: payload });

    const { key, claimType, status, donation } = payload;
    if (!key || !claimType || !status || !isDefined(donation)) {
      throw new MissingDataException([
        ...(!key ? ['Key'] : []),
        ...(!claimType ? ['Claim Type'] : []),
        ...(!status ? ['Claim Status'] : []),
        ...(!isDefined(donation) ? ['Donation'] : []),
      ]);
    }

    //Save all notify in database
    payload.state = NotifyStateType.READY;
    await this.notifyClaimRepository.create(payload);

    // This flow has been replaced by the sync get all claim cron in the pix-keys microservice.
    return;

    const pixKey = await this.pixKeyService.getPixKeyByKey(key);

    this.logger.debug('Pix Key returned in claim process.', { pixKey });

    if (!pixKey) {
      throw new PixKeyNotFoundException({ key });
    }

    //Check pixKey state and call function for send message to pixKey
    switch (pixKey.state) {
      case KeyState.PORTABILITY_STARTED:
        return this.handlePortabilityStarted(key, donation, status, claimType);
      case KeyState.PORTABILITY_CONFIRMED:
        return this.handlePortabilityConfirmed(
          key,
          donation,
          status,
          claimType,
        );
      case KeyState.OWNERSHIP_STARTED:
        return this.handleOwnershipStarted(key, donation, status, claimType);
      case KeyState.OWNERSHIP_WAITING:
        return this.handleOwnershipWaiting(key, donation, status, claimType);
      case KeyState.OWNERSHIP_CONFIRMED:
        return this.handleOwnershipConfirmed(key, donation, status, claimType);
      case KeyState.READY:
      case KeyState.ADD_KEY_READY:
      case KeyState.PORTABILITY_READY:
      case KeyState.OWNERSHIP_READY:
        return this.handleReady(key, donation, status, claimType);
      case KeyState.CLAIM_CLOSING:
        return this.handleClaimClosing(key, donation, status, claimType);
    }
  }

  //Handle rule portability started and send to pixKey for update
  async handlePortabilityStarted(
    key: string,
    donation: boolean,
    status: ClaimStatusType,
    claimType: ClaimType,
  ): Promise<void> {
    /* Rules *
      - Donation is false and claimType is Portability
        OPEN - Indepotent
        CONFIRMED - send message to pix key for set status PORTABILITY_CONFIRMED and fire event
        CANCELLED - send message to pix key for set status PORTABILITY_CANCELED and fire event
        COMPLETED - Send msg error
        WAITING_RESOLUTION - Send msg error

      - Donation is true or claimType is OWNERSHIP
        Send msg error
     */
    if (donation || claimType === ClaimType.OWNERSHIP) {
      throw new NotifyClaimInvalidFlowException({
        key,
        donation,
        claimType,
        status,
      });
    } else if (!donation && claimType === ClaimType.PORTABILITY) {
      switch (status) {
        case ClaimStatusType.CONFIRMED:
          await this.pixKeyService.confirmPortabilityClaim(key);
          break;
        case ClaimStatusType.CANCELLED:
          await this.pixKeyService.cancelPortabilityClaim(key);
          break;
        case ClaimStatusType.COMPLETED:
          await this.pixKeyService.completePortabilityClaim(key);
          break;
        case ClaimStatusType.WAITING_RESOLUTION:
          throw new NotifyClaimInvalidFlowException({
            key,
            donation,
            claimType,
            status,
          });
        default:
          break;
      }
    }
  }

  //Handle rule portability started and send to pixKey for update
  async handlePortabilityConfirmed(
    key: string,
    donation: boolean,
    status: ClaimStatusType,
    claimType: ClaimType,
  ): Promise<void> {
    /* Rules *
      - Donation is false and claimType is Portability
        OPEN - Indepotent
        CONFIRMED - Indepotent
        COMPLETED - send message to pix key for set status PORTABILITY_READY and fire event
        CANCELLED - send message to pix key for set status PORTABILITY_CANCELED and fire event
        WAITING_RESOLUTION - Send msg error

      - Donation is true or claimType is OWNERSHIP
        Send msg error
     */
    if (donation || claimType === ClaimType.OWNERSHIP) {
      throw new NotifyClaimInvalidFlowException({
        key,
        donation,
        claimType,
        status,
      });
    } else if (!donation && claimType === ClaimType.PORTABILITY) {
      switch (status) {
        case ClaimStatusType.COMPLETED:
          await this.pixKeyService.completePortabilityClaim(key);
          break;
        case ClaimStatusType.CANCELLED:
          await this.pixKeyService.cancelPortabilityClaim(key);
          break;
        case ClaimStatusType.WAITING_RESOLUTION:
          throw new NotifyClaimInvalidFlowException({
            key,
            donation,
            claimType,
            status,
          });
        default:
          break;
      }
    }
  }

  //Handle rule ownership started and send to pixKey for update
  async handleOwnershipStarted(
    key: string,
    donation: boolean,
    status: ClaimStatusType,
    claimType: ClaimType,
  ): Promise<void> {
    /* Rules *
      - Donation is false and claimType is Ownership
        OPEN - Indepotent
        WAITING_RESOLUTION - send message to pix key for set status OWNERSHIP_WAITING and fire event
        CONFIRMED - send message to pix key for set status OWNERSHIP_CONFIRMED and fire event
        CANCELLED - send message to pix key for set status OWNERSHIP_CANCELED and fire event
        COMPLETED - send message to pix key for set status OWNERSHIP_CONFIRMED and fire event

      - Donation is true or claimType is Portability
        Send msg error
     */
    if (donation || claimType === ClaimType.PORTABILITY) {
      throw new NotifyClaimInvalidFlowException({
        key,
        donation,
        claimType,
        status,
      });
    } else if (!donation && claimType === ClaimType.OWNERSHIP) {
      switch (status) {
        case ClaimStatusType.WAITING_RESOLUTION:
          await this.pixKeyService.waitOwnershipClaim(key);
          break;
        case ClaimStatusType.CONFIRMED:
        case ClaimStatusType.COMPLETED:
          await this.pixKeyService.confirmOwnershipClaim(key);
          break;
        case ClaimStatusType.CANCELLED:
          await this.pixKeyService.cancelOwnershipClaim(key);
          break;
        default:
          break;
      }
    }
  }

  //Handle rule ownership waiting and send to pixKey for update
  async handleOwnershipWaiting(
    key: string,
    donation: boolean,
    status: ClaimStatusType,
    claimType: ClaimType,
  ): Promise<void> {
    /* Rules *
      - Donation is false and claimType is Ownership
        OPEN - Indepotent
        WAITING_RESOLUTION - Indepotent
        CONFIRMED - set status OWNERSHIP_CONFIRMED and fire event
        CANCELLED - set status OWNERSHIP_CANCELED and fire event
        COMPLETED - Send msg error

      - Donation is true or claimType is Portability
        Send msg error
     */
    if (donation || claimType === ClaimType.PORTABILITY) {
      throw new NotifyClaimInvalidFlowException({
        key,
        donation,
        claimType,
        status,
      });
    } else if (!donation && claimType === ClaimType.OWNERSHIP) {
      switch (status) {
        case ClaimStatusType.CONFIRMED:
          await this.pixKeyService.confirmOwnershipClaim(key);
          break;
        case ClaimStatusType.CANCELLED:
          await this.pixKeyService.cancelOwnershipClaim(key);
          break;
        case ClaimStatusType.COMPLETED:
          throw new NotifyClaimInvalidFlowException({
            key,
            donation,
            claimType,
            status,
          });
        default:
          break;
      }
    }
  }

  //Handle rule ownership confirmed and send to pixKey for update
  async handleOwnershipConfirmed(
    key: string,
    donation: boolean,
    status: ClaimStatusType,
    claimType: ClaimType,
  ): Promise<void> {
    /* Rules *
      - Donation is false and claimType is Ownership
        OPEN - Indepotent
        WAITING_RESOLUTION - Indepotent
        CONFIRMED - Indepotent
        COMPLETED - send message to pix key for set status OWNERSHIP_READY and fire event
        CANCELLED - send message to pix key for set status OWNERSHIP_CANCELED and fire event

      - Donation is true or claimType is Portability
        Send msg error
     */
    if (donation || claimType === ClaimType.PORTABILITY) {
      throw new NotifyClaimInvalidFlowException({
        key,
        donation,
        claimType,
        status,
      });
    } else if (!donation && claimType === ClaimType.OWNERSHIP) {
      switch (status) {
        case ClaimStatusType.COMPLETED:
          await this.pixKeyService.completeOwnershipClaim(key);
          break;
        case ClaimStatusType.CANCELLED:
          await this.pixKeyService.cancelOwnershipClaim(key);
          break;
        default:
          break;
      }
    }
  }

  //Handle rule ready status and send to pixKey for update
  async handleReady(
    key: string,
    donation: boolean,
    status: ClaimStatusType,
    claimType: ClaimType,
  ): Promise<void> {
    /* Rules *
      - Donation is true and claimType is Ownership
        OPEN - send message to pix key for set status CLAIM_PENDING and fire event
        WAITING_RESOLUTION - send message to pix key for set status CLAIM_PENDING and fire event
        CONFIRMED - send message to pix key for set status CLAIM_PENDING and fire event
      
      - Donation is true and claimType is Portability
        OPEN - send message to pix key for set status PORTABILITY_REQUEST_PENDING and fire event
        WAITING_RESOLUTION - send message to pix key for set status PORTABILITY_REQUEST_PENDING and fire event
        CONFIRMED - send message to pix key for set status PORTABILITY_REQUEST_PENDING and fire event

      - Donation is false or claimStatus is COMPLETED or CANCELLED
         - Send msg error
     */

    if (
      !donation ||
      [ClaimStatusType.COMPLETED, ClaimStatusType.CANCELLED].includes(status)
    ) {
      throw new NotifyClaimInvalidFlowException({
        key,
        donation,
        claimType,
        status,
      });
    } else if (
      donation &&
      [
        ClaimStatusType.OPEN,
        ClaimStatusType.WAITING_RESOLUTION,
        ClaimStatusType.CONFIRMED,
      ].includes(status)
    ) {
      switch (claimType) {
        case ClaimType.OWNERSHIP:
          await this.pixKeyService.readyOwnershipClaim(key);
          break;
        case ClaimType.PORTABILITY:
          await this.pixKeyService.readyPortabilityClaim(key);
          break;
      }
    }
  }

  //Handle rule claim closing and send to pixKey for update
  async handleClaimClosing(
    key: string,
    donation: boolean,
    status: ClaimStatusType,
    claimType: ClaimType,
  ): Promise<void> {
    /* Rules *
      - Donation is false or claimType is Portability or claimStatus is CANCELED
        - Send msg error

      - Donation is true and claimType is Ownership
        OPEN - Indepotent
        WAITING_RESOLUTION - Indepotent
        CONFIRMED - Indepotent
        COMPLETED - send message to pix key for set status CLAIM_CLOSED and fire event
     */
    if (
      status === ClaimStatusType.CANCELLED ||
      !donation ||
      claimType === ClaimType.PORTABILITY
    ) {
      throw new NotifyClaimInvalidFlowException({
        key,
        donation,
        claimType,
        status,
      });
    } else if (donation && claimType === ClaimType.OWNERSHIP) {
      switch (status) {
        case ClaimStatusType.COMPLETED:
          await this.pixKeyService.completeClaimClosing(key);
          break;
        default:
          break;
      }
    }
  }
}
