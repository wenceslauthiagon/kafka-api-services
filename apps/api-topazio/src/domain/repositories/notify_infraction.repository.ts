import { NotifyInfraction } from '@zro/api-topazio/domain';
import { PixInfractionStatus } from '@zro/pix-payments/domain';

export interface NotifyInfractionRepository {
  /**
   * Insert a Notify.
   * @param {NotifyInfraction} notify Notify to save.
   * @returns {NotifyInfraction} Created notify Infraction.
   */
  create: (notifyInfraction: NotifyInfraction) => Promise<NotifyInfraction>;

  /**
   * Get a Notify.
   * @param {infractionId} infractionId string.
   * @param {status} status PixInfractionStatus.
   * @returns {NotifyInfraction} Get notify Infraction.
   */
  getByInfractionIdAndStatus: (
    infractionId: string,
    status: PixInfractionStatus,
  ) => Promise<NotifyInfraction>;
}
