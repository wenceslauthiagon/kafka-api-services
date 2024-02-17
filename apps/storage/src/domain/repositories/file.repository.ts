import { Pagination, TPaginationResponse } from '@zro/common';
import { File } from '@zro/storage/domain';

export interface FileRepository {
  /**
   * Create a File.
   * @param {String} filename Remittance Order worksheet filename received to store.
   * @returns {File} Created remittance.
   */
  create: (filename: File) => Promise<File>;

  /**
   * Search by File ID.
   * @param {UUID} id File ID.
   * @return {File} File reference found.
   */
  getById: (id: string) => Promise<File>;

  /**
   * Search by all files each are at the same folder.
   * @param {String} foldername File filename.
   * @return {File[]} Array of Files reference found.
   */
  getAllByFoldername: (
    foldername: string,
    pagination: Pagination,
  ) => Promise<TPaginationResponse<File>>;

  /**
   * Search by File filename.
   * @param {String} filename File filename.
   * @return {File} File reference found.
   */
  getByFilename: (filename: string) => Promise<File>;

  /**
   * Update file by ID to do a soft delete.
   * @param {UUID} id File ID.
   * @return {File} File reference found.
   */
  update: (file: File) => Promise<File>;
}
