import { PixInfraction } from '@zro/pix-payments/domain';

export interface PixInfractionRepository {
  /**
   * Insert an infraction.
   * @param infraction to save.
   * @returns Created Infraction.
   */
  create: (infraction: PixInfraction) => Promise<PixInfraction>;

  /**
   * Get an infraction.
   * @param id infraction id to get.
   * @returns Infraction.
   */
  getById: (id: string) => Promise<PixInfraction>;

  /**
   * Get an infraction.
   * @param infractionPspId infraction psp id to get.
   * @returns Infraction.
   */
  getByInfractionPspId: (infractionPspId: string) => Promise<PixInfraction>;

  /**
   * Update an infraction.
   * @param payment Infraction to update.
   * @returns Updated infraction.
   */
  update: (infraction: PixInfraction) => Promise<PixInfraction>;

  /**
   * Get an infraction by issue id.
   * @param issueId infraction issue id to get.
   * @returns Infraction.
   */
  getByIssueId: (issueId: number) => Promise<PixInfraction>;

  /**
   * Get all infractions closed confirmed and agreed.
   * @returns Infraction list.
   */
  getAllTypeIsRequestRefundAndStateIsClosedConfimedAndAnalysisIsAgreed: () => Promise<
    PixInfraction[]
  >;
}
