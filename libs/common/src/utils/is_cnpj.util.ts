import { cnpj } from 'cpf-cnpj-validator';

/**
 * Check if the value is a valid cnpj number
 * @param value The value
 * @returns The bool
 */
export const isCnpj = (value: string) => cnpj.isValid(value);
