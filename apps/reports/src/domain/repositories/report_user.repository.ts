import { PersonType, User } from '@zro/users/domain';
import { ReportUser } from '@zro/reports/domain';

export type GetAllReportUserByDate = {
  dateStart: Date;
  dateEnd: Date;
};

export enum ReportUserSort {
  CREATED_AT = 'created_at',
}

export type TGetAllGeneratorFilter = {
  type?: PersonType;
};

export interface ReportUserRepository {
  /**
   * Insert a ReportUser.
   * @param reportUser ReportUser to save.
   * @returns Created ReportUser.
   */
  create: (reportUser: ReportUser) => Promise<ReportUser>;

  /**
   * Update a ReportUser.
   * @param reportUser ReportUser to update.
   * @returns Updated reportUser.
   */
  update: (reportUser: ReportUser) => Promise<ReportUser>;

  /**
   * get a ReportUser by id.
   * @param id ReportUser id to get.
   * @returns ReportUser found or null otherwise.
   */
  getById: (id: string) => Promise<ReportUser>;

  /**
   * get a ReportUser by user.
   * @param User ReportUser User.
   * @returns ReportUser found or null otherwise.
   */
  getByUser: (User: User) => Promise<ReportUser>;

  /**
   * Get all report users by filter.
   * @param filter ReportUser filter to get.
   * @returns Async generator of ReportUser.
   */
  getAllGeneratorByFilter: (
    filter?: TGetAllGeneratorFilter,
  ) => AsyncGenerator<ReportUser>;
}
