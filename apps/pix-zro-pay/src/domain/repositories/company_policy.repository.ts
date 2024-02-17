import { Company, CompanyPolicy } from '@zro/pix-zro-pay/domain';

export interface CompanyPolicyRepository {
  /**
   * Insert a CompanyPolicy.
   * @param companyPolicy CompanyPolicy to save.
   * @returns Created CompanyPolicy.
   */
  create(companyPolicy: CompanyPolicy): Promise<CompanyPolicy>;

  /**
   * Update a CompanyPolicy.
   * @param companyPolicy CompanyPolicy to update.
   * @returns Updated companyPolicy.
   */
  update(companyPolicy: CompanyPolicy): Promise<CompanyPolicy>;

  /**
   * get a CompanyPolicy by id.
   * @param id CompanyPolicy id to get.
   * @returns get CompanyPolicy.
   */
  getById(id: number): Promise<CompanyPolicy>;

  /**
   * get a CompanyPolicy by company.
   * @param company CompanyPolicy company to get.
   * @returns get CompanyPolicy.
   */
  getByCompany(company: Company): Promise<CompanyPolicy>;
}
