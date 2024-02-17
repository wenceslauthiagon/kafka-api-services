import { cpf } from 'cpf-cnpj-validator';

const CPF_LENGTH = 11;
const CPF_START_INDEX = 3;
const CPF_END_INDEX = 12;

/**
 * To mask the first 3 and last 2 digits and format cpf ***.777.888-**
 * @param cpfDigits The cpf number
 * @returns The formatted and masked cpf
 */
export const formatCpf = (cpfDigits: string): string => {
  // Does not have the length of the cpf
  if (cpfDigits?.length !== CPF_LENGTH) return cpfDigits;

  // Adds points and trace ".digits.digits-"
  const finalCpf = cpf.format(cpfDigits);

  return `***${finalCpf.substring(CPF_START_INDEX, CPF_END_INDEX)}**`;
};

/**
 * Format cpf
 * @param cpfDigits The cpf number
 * @returns The formatted and masked cpf
 */
export const formatCpfWithoutMask = (cpfDigits: string): string => {
  // Does not have the length of the cpf
  if (cpfDigits?.length !== CPF_LENGTH) return cpfDigits;

  // Adds points and trace ".digits.digits-"
  const finalCpf = cpf.format(cpfDigits);

  return finalCpf;
};
