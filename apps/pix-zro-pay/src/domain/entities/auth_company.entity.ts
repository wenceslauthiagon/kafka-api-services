import { Company } from '@zro/pix-zro-pay/domain';

export type AuthCompany = Pick<Company, 'id' | 'cnpj' | 'name'>;
