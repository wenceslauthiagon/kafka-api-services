import { Domain } from '@zro/common';

export enum FeatureSettingName {
  CREATE_EXCHANGE_QUOTATION = 'create_exchange_quotation',
}

export enum FeatureSettingState {
  ACTIVE = 'ACTIVE',
  DEACTIVE = 'DEACTIVE',
}

export interface FeatureSetting extends Domain<string> {
  name: FeatureSettingName;
  state: FeatureSettingState;
  createdAt?: Date;
  updatedAt?: Date;
}

export class FeatureSettingEntity implements FeatureSetting {
  id: string;
  name: FeatureSettingName;
  state: FeatureSettingState;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(props: Partial<FeatureSetting>) {
    Object.assign(this, props);
  }
}
