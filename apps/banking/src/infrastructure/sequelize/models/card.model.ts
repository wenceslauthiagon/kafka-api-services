import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  Default,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import { Card, CardEntity, CardStatus } from '@zro/banking/domain';
import { User, UserEntity } from '@zro/users/domain';

type CardAttributes = Card & {
  userId?: User['id'];
};
type CardCreationAttributes = CardAttributes;

@Table({
  tableName: 'Cards',
  timestamps: true,
  underscored: true,
})
export class CardModel
  extends DatabaseModel<CardAttributes, CardCreationAttributes>
  implements Card
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  userId: User['id'];
  user: User;

  @AllowNull(true)
  @Column({
    type: DataType.INTEGER,
    field: 'dock_card_id',
  })
  cardPspId: number;

  @AllowNull(true)
  @Default(CardStatus.PASSWORD_PENDING)
  @Column(DataType.STRING)
  status: CardStatus;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isVirtual: boolean;

  @AllowNull(true)
  @Column(DataType.STRING)
  number: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: CardCreationAttributes, options?: BuildOptions) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): Card {
    const entity = new CardEntity(this.get({ plain: true }));

    entity.user = new UserEntity({
      id: this.userId,
    });

    delete entity['userId'];

    return entity;
  }
}
