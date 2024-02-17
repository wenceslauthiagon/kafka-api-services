import { UserLegalRepresentor } from '@zro/users/domain';
import { ReportUserLegalRepresentor } from '@zro/reports/domain';

export enum ReportUserLegalRepresentorSort {
  CREATED_AT = 'created_at',
}

export interface ReportUserLegalRepresentorRepository {
  /**
   * Insert a ReportUserLegalRepresentor.
   * @param reportUserLegalRepresentor ReportUserLegalRepresentor to save.
   * @returns Created ReportUserLegalRepresentor.
   */
  create: (
    reportUserLegalRepresentor: ReportUserLegalRepresentor,
  ) => Promise<ReportUserLegalRepresentor>;

  /**
   * Update a ReportUserLegalRepresentor.
   * @param reportUserLegalRepresentor ReportUserLegalRepresentor to update.
   * @returns Updated reportUserLegalRepresentor.
   */
  update: (
    reportUserLegalRepresentor: ReportUserLegalRepresentor,
  ) => Promise<ReportUserLegalRepresentor>;

  /**
   * get a ReportUserLegalRepresentor by id.
   * @param id ReportUserLegalRepresentor id to get.
   * @returns ReportUserLegalRepresentor found or null otherwise.
   */
  getById: (id: string) => Promise<ReportUserLegalRepresentor>;

  /**
   * get a ReportUserLegalRepresentor by UserLegalRepresentor.
   * @param UserLegalRepresentor ReportUserLegalRepresentor UserLegalRepresentor.
   * @returns ReportUserLegalRepresentor found or null otherwise.
   */
  getByUserLegalRepresentor: (
    UserLegalRepresentor: UserLegalRepresentor,
  ) => Promise<ReportUserLegalRepresentor>;

  /**
   * Get all report UserLegalRepresentor.
   * @returns Async generator of UserLegalRepresentor.
   */
  getAllGenerator: () => AsyncGenerator<UserLegalRepresentor>;
}
