import { cnpj } from 'cpf-cnpj-validator';

const CNPJ_LENGTH = 14;

/**
 * To format cnpj "00.000.000/0000-00"
 * @param cnpjDigits The cnpj number
 * @returns The formatted cnpj
 */
export const formatCnpj = (cnpjDigits: string): string => {
  // Does not have the length of the cnpj
  if (cnpjDigits?.length !== CNPJ_LENGTH) return cnpjDigits;

  return cnpj.format(cnpjDigits);
};
