import { Transaction } from 'sequelize';
import {
  DatabaseRepository,
  Pagination,
  paginationToDomain,
  paginationWhere,
  TPaginationResponse,
} from '@zro/common';
import { File, FileRepository } from '@zro/storage/domain';
import { FileModel } from '@zro/storage/infrastructure';

export class FileDatabaseRepository
  extends DatabaseRepository
  implements FileRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(model: FileModel): File {
    return model?.toDomain() ?? null;
  }

  async create(file: File): Promise<File> {
    const fileGenerated = await FileModel.create<FileModel>(file, {
      transaction: this.transaction,
    });

    file.createdAt = fileGenerated.createdAt;
    return file;
  }

  async getByFilename(fileName: string): Promise<File> {
    return FileModel.findOne<FileModel>({
      where: {
        fileName,
      },
      transaction: this.transaction,
    }).then(FileDatabaseRepository.toDomain);
  }

  async getById(id: string): Promise<File> {
    return FileModel.findOne<FileModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(FileDatabaseRepository.toDomain);
  }

  async getAllByFoldername(
    folderName: string,
    pagination: Pagination,
  ): Promise<TPaginationResponse<File>> {
    return FileModel.findAndCountAll<FileModel>({
      ...paginationWhere(pagination),
      where: {
        folderName,
      },
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(FileDatabaseRepository.toDomain),
      ),
    );
  }

  async update(file: File): Promise<File> {
    await FileModel.update<FileModel>(file, {
      where: { id: file.id },
      transaction: this.transaction,
    });

    return file;
  }
}
