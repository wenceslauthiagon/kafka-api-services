import { Client, Company } from '@zro/pix-zro-pay/domain';

export interface ClientRepository {
  /**
   * Insert a Client.
   * @param client Client to save.
   * @returns Created Client.
   */
  create(client: Client): Promise<Client>;

  /**
   * Update a Client.
   * @param client Client to update.
   * @returns Updated client.
   */
  update(client: Client): Promise<Client>;

  /**
   * get a Client by id.
   * @param id Client id to get.
   * @returns get Client.
   */
  getById(id: number): Promise<Client>;

  /**
   * get a Client by document and company.
   * @param document Client document to get.
   * @param company Client company to get.
   * @returns get Client.
   */
  getByDocumentAndCompany(document: string, company: Company): Promise<Client>;
}
