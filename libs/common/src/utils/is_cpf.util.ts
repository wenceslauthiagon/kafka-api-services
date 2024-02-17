import { cpf } from 'cpf-cnpj-validator';

/**
 * Check if the value is a valid cpf number
 * @param value The value
 * @returns The bool
 */
export const isCpf = (value: string) => cpf.isValid(value);
