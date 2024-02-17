import { Occupation } from '@zro/users/domain';

export interface OccupationRepository {
  /**
   * Get occupation by codCbo.
   * @param codCbo The occupation cobCbo.
   * @returns The occupation found or null otherwise.
   */
  getByCodCbo(codCbo: Occupation['codCbo']): Promise<Occupation>;
}
