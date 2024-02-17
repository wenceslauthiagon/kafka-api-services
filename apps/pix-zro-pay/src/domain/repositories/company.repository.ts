import { Company } from '@zro/pix-zro-pay/domain';

export interface CompanyRepository {
  /**
   * Insert a Company.
   * @param company Company to save.
   * @returns Created Company.
   */
  create(company: Company): Promise<Company>;

  /**
   * Update a Company.
   * @param company Company to update.
   * @returns Updated company.
   */
  update(company: Company): Promise<Company>;

  /**
   * get a Company by id.
   * @param id Company id to get.
   * @returns get Company.
   */
  getById(id: number): Promise<Company>;

  /**
   * get a Company by id and xApiKey.
   * @param id Company id to get.
   * @param xApiKey Company xApiKey to get.
   * @returns get Company.
   */
  getByIdAndXApiKey(id: number, xApiKey: string): Promise<Company>;
}
