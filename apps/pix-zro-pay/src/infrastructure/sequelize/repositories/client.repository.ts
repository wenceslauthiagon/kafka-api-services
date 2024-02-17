import { DatabaseRepository } from '@zro/common';
import { Client, ClientRepository, Company } from '@zro/pix-zro-pay/domain';
import { ClientModel } from '@zro/pix-zro-pay/infrastructure';

export class ClientDatabaseRepository
  extends DatabaseRepository
  implements ClientRepository
{
  static toDomain(clientModel: ClientModel): Client {
    return clientModel?.toDomain() ?? null;
  }

  async create(client: Client): Promise<Client> {
    const clientGenerated = await ClientModel.create<ClientModel>(client, {
      transaction: this.transaction,
    });

    return clientGenerated.dataValues;
  }

  async update(client: Client): Promise<Client> {
    await ClientModel.update<ClientModel>(client, {
      where: { id: client.id },
      transaction: this.transaction,
    });

    return client;
  }

  async getById(id: number): Promise<Client> {
    return ClientModel.findOne<ClientModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(ClientDatabaseRepository.toDomain);
  }

  async getByDocumentAndCompany(
    document: string,
    company: Company,
  ): Promise<Client> {
    return ClientModel.findOne<ClientModel>({
      where: {
        document,
        companyId: company.id,
      },
      transaction: this.transaction,
    }).then(ClientDatabaseRepository.toDomain);
  }
}
