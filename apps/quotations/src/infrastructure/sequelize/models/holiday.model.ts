import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  Default,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  Holiday,
  HolidayEntity,
  HolidayLevel,
  HolidayType,
} from '@zro/quotations/domain';

type HolidayAttributes = Holiday;
type HolidayCreationAttributes = HolidayAttributes;

@Table({
  tableName: 'holidays',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class HolidayModel
  extends DatabaseModel<HolidayAttributes, HolidayCreationAttributes>
  implements Holiday
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  startDate: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  endDate: Date;

  @Column(DataType.STRING)
  name: string;

  @Column(DataType.STRING)
  type: HolidayType;

  @Column(DataType.STRING)
  level: HolidayLevel;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @AllowNull(true)
  @Column(DataType.DATE)
  deletedAt: Date;

  constructor(values?: HolidayCreationAttributes, options?: BuildOptions) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): Holiday {
    const entity = new HolidayEntity(this.get({ plain: true }));
    return entity;
  }
}
