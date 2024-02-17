import { BuildOptions } from 'sequelize';
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  DeletedAt,
  Min,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import {
  BotOtc,
  BotOtcControl,
  BotOtcEntity,
  BotOtcStatus,
  BotOtcType,
} from '@zro/otc-bot/domain';
import { StreamPair, StreamPairEntity } from '@zro/quotations/domain';
import { Provider, ProviderEntity } from '@zro/otc/domain';

export type BotOtcAttributes = BotOtc & {
  fromPairId: StreamPair['id'];
  fromProviderId: Provider['id'];
  toPairId: StreamPair['id'];
  toProviderId: Provider['id'];
};
export type BotOtcCreationAttributes = BotOtcAttributes;

@Table({
  tableName: 'bot_otc',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class BotOtcModel
  extends Model<BotOtcAttributes, BotOtcCreationAttributes>
  implements BotOtc
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  fromPairId: string;
  fromPair: StreamPair;

  @AllowNull(false)
  @Column(DataType.UUID)
  fromProviderId: string;
  fromProvider: Provider;

  @AllowNull(false)
  @Column(DataType.UUID)
  toPairId: string;
  toPair: StreamPair;

  @AllowNull(false)
  @Column(DataType.UUID)
  toProviderId: string;
  toProvider: Provider;

  @AllowNull(false)
  @Min(0)
  @Default(0)
  @Column(DataType.INTEGER)
  spread: number;

  @AllowNull(false)
  @Min(0)
  @Default(0)
  @Column(DataType.INTEGER)
  balance: number;

  @AllowNull(false)
  @Min(0)
  @Default(0)
  @Column(DataType.INTEGER)
  step: number;

  @AllowNull(false)
  @Default(BotOtcControl.STOP)
  @Column(DataType.STRING)
  control: BotOtcControl;

  @AllowNull(false)
  @Default(BotOtcStatus.STOPPED)
  @Column(DataType.STRING)
  status: BotOtcStatus;

  @AllowNull(false)
  @Column(DataType.STRING)
  type: BotOtcType;

  @Column(DataType.STRING)
  failedCode?: string;

  @Column(DataType.STRING)
  failedMessage?: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt: Date;

  constructor(values?: BotOtcCreationAttributes, options?: BuildOptions) {
    super(values, options);
    this.fromPairId = values?.fromPairId ?? values?.fromPair?.id;
    this.fromProviderId = values?.fromProviderId ?? values?.fromProvider?.id;
    this.toPairId = values?.toPairId ?? values?.toPair?.id;
    this.toProviderId = values?.toProviderId ?? values?.toProvider?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): BotOtc {
    const entity = new BotOtcEntity(this.get({ plain: true }));
    entity.fromPair = new StreamPairEntity({
      id: this.fromPairId,
    });
    entity.fromProvider = new ProviderEntity({
      id: this.fromProviderId,
    });
    entity.toPair = new StreamPairEntity({
      id: this.toPairId,
    });
    entity.toProvider = new ProviderEntity({
      id: this.toProviderId,
    });

    delete entity['fromPairId'];
    delete entity['fromProviderId'];
    delete entity['toPairId'];
    delete entity['toProviderId'];

    return entity;
  }

  get spreadFloat(): number {
    return this.toDomain().spreadFloat;
  }

  isRunning(): boolean {
    return this.toDomain().isRunning();
  }

  isStoping(): boolean {
    return this.toDomain().isStoping();
  }

  isStopped(): boolean {
    return this.toDomain().isStopped();
  }

  shouldStart(): boolean {
    return this.toDomain().shouldStart();
  }

  shouldStop(): boolean {
    return this.toDomain().shouldStop();
  }

  shouldKill(): boolean {
    return this.toDomain().shouldKill();
  }
}
