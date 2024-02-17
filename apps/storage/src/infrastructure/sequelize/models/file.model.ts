import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  Default,
  DeletedAt,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import { File, FileEntity } from '@zro/storage/domain';

type FileAttributes = File;
type FileCreationAttributes = FileAttributes;

@Table({
  tableName: 'storage_files',
  paranoid: true,
  timestamps: true,
  underscored: true,
})
export class FileModel
  extends DatabaseModel<FileAttributes, FileCreationAttributes>
  implements File
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  fileName: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  folderName: string;

  @Column(DataType.STRING)
  gatewayName: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt?: Date;

  constructor(values?: FileAttributes, options?: BuildOptions) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): File {
    const entity = new FileEntity(this.get({ plain: true }));
    return entity;
  }
}
