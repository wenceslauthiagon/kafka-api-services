import { ReportUserConfig } from '@zro/reports/domain';

export enum ReportUserConfigSort {
  CREATED_AT = 'created_at',
}

export interface ReportUserConfigRepository {
  /**
   * Get all ReportUserConfigs
   * @returns ReportUserConfigs
   */
  getAll: () => Promise<ReportUserConfig[]>;

  /**
   * Get all report UserConfig.
   * @returns Async generator of ReportUserConfig.
   */
  getAllGenerator: () => AsyncGenerator<ReportUserConfig>;
}
