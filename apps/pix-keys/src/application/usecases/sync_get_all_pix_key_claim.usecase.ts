import { Logger } from 'winston';
import { getMoment } from '@zro/common';
import { PixKeyClaimEntity, PixKeyClaimRepository } from '@zro/pix-keys/domain';
import {
  GetClaimPixKeyPspRequest,
  PixKeyClaimEventEmitter,
  PixKeyGateway,
} from '@zro/pix-keys/application';

export class SyncGetAllPixKeyClaimPixKeyUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixKeyClaimRepository Pix key claim repository.
   * @param eventEmitter Pix key claim event emitter.
   * @param pspGateway PSP gateway instance.
   * @param ispb Zro ispb to search.
   * @param pageSize Page size to search.
   * @param limitDay Limit days to search.
   */
  constructor(
    private logger: Logger,
    private readonly pixKeyClaimRepository: PixKeyClaimRepository,
    private readonly eventEmitter: PixKeyClaimEventEmitter,
    private readonly pspGateway: PixKeyGateway,
    private readonly ispb: string,
    private readonly pageSize: number,
    private readonly limitDay: number,
  ) {
    this.logger = logger.child({
      context: SyncGetAllPixKeyClaimPixKeyUseCase.name,
    });
  }

  /**
   * Sync get all pix key claim from psp.
   *
   */
  async execute(): Promise<void> {
    const lastChangeDateStart = getMoment()
      .subtract(this.limitDay, 'days')
      .toDate();
    const lastChangeDateEnd = getMoment().toDate();

    const body: GetClaimPixKeyPspRequest = {
      ispb: this.ispb,
      limit: this.pageSize,
      lastChangeDateStart,
      lastChangeDateEnd,
    };

    let hasMoreElements = true;

    while (hasMoreElements) {
      const pixKeyClaimsFound = await this.pspGateway.getClaimPixKey(body);

      this.logger.debug('PixKeyClaim pspGateway response.', {
        pixKeyClaims: pixKeyClaimsFound,
      });

      hasMoreElements = pixKeyClaimsFound.hasMoreElements;

      for (const claim of pixKeyClaimsFound.claims) {
        const pixKeyClaimFound = await this.pixKeyClaimRepository.getById(
          claim.id,
        );

        this.logger.debug('PixKeyClaim found by id.', {
          pixKeyClaim: pixKeyClaimFound,
        });

        // Check idempotence.
        if (pixKeyClaimFound?.status === claim.status) {
          continue;
        }

        const pixKeyClaim = new PixKeyClaimEntity({
          id: claim.id,
          keyType: claim.keyType,
          key: claim.key,
          type: claim.type,
          status: claim.status,
          ispb: claim.ispb,
          document: claim.document,
          branch: claim.branch,
          accountNumber: claim.accountNumber,
          personType: claim.personType,
          finalResolutionDate: claim.finalResolutionDate,
          finalCompleteDate: claim.finalCompleteDate,
          lastChangeDate: claim.lastChangeDate,
        });

        if (!pixKeyClaimFound) {
          await this.pixKeyClaimRepository.create(pixKeyClaim);
          this.logger.debug('PixKeyClaim created.', { pixKeyClaim });
        } else {
          await this.pixKeyClaimRepository.update(pixKeyClaim);
          this.logger.debug('PixKeyClaim updated.', { pixKeyClaim });
        }

        this.eventEmitter.readyPixKeyClaim(pixKeyClaim);
      }

      this.logger.debug('PixKeyClaims data sent.');
    }
  }
}
