const CPF_LENGTH = 11;
const CPF_START_INDEX = 3;
const CPF_END_INDEX = 9;

/**
 * To mask the first 3 and last 2 digits
 * @param cpf The cpf number
 * @returns The masked cpf
 */
export const cpfMask = (cpf: string) => {
  // Does not have the length of the cpf
  if (cpf?.length !== CPF_LENGTH) return cpf;

  return `***${cpf.substring(CPF_START_INDEX, CPF_END_INDEX)}**`;
};
