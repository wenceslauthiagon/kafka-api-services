const CNPJ_LENGTH = 14;
const CNPJ_START_INDEX = 3;
const CNPJ_END_INDEX = 11;

/**
 * To mask the first 3 and last 3 digits
 * @param cnpj The cnpj number
 * @returns The masked cnpj
 */
export const cnpjMask = (cnpj: string) => {
  // Does not have the length of the cnpj
  if (cnpj?.length !== CNPJ_LENGTH) return cnpj;

  return `***${cnpj.substring(CNPJ_START_INDEX, CNPJ_END_INDEX)}***`;
};
