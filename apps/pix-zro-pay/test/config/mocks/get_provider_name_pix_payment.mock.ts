import { BankAccountName } from '@zro/pix-zro-pay/domain';

export const success = (): string => BankAccountName.BANK_ZRO_BANK;
export const notFound = (): string => undefined;
